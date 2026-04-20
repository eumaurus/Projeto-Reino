import { useMemo, useState } from 'react'
import {
    Receipt, Clock, CheckCircle2, XCircle, PawPrint, User, Phone,
    CreditCard,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import {
    listCheckouts, markCheckoutPaid, cancelCheckout, getCheckoutStats,
} from '../../services/checkouts.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import StatCard from '../../shared/components/ui/StatCard'
import Tabs from '../../shared/components/ui/Tabs'
import Button from '../../shared/components/ui/Button'
import Badge, { StatusBadge } from '../../shared/components/ui/Badge'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import EmptyState from '../../shared/components/ui/EmptyState'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import Modal from '../../shared/components/ui/Modal'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import { useToast } from '../../shared/components/ui/Toast'
import { CHECKOUT_STATUS, PAYMENT_METHODS } from '../../shared/constants/statuses'
import { formatBRL } from '../../shared/utils/formatters'
import { formatRelative, todayISO } from '../../shared/utils/dates'
import '../vet/checkout.css'

export default function ReceptionCheckoutsPage() {
    const toast = useToast()
    const [tab, setTab] = useState('pending')
    const [payingTarget, setPayingTarget]       = useState(null)
    const [paymentMethod, setPaymentMethod]     = useState('pix')
    const [cancellingTarget, setCancellingTarget] = useState(null)
    const [processing, setProcessing]           = useState(false)

    const today    = todayISO()
    const checkouts = useAsync(() => listCheckouts(), [])
    const stats     = useAsync(() => getCheckoutStats({ from: today, to: today }), [])

    const list = useMemo(() => checkouts.data ?? [], [checkouts.data])

    const counts = useMemo(() => ({
        pending:   list.filter(c => c.status === 'pending').length,
        paid:      list.filter(c => c.status === 'paid').length,
        cancelled: list.filter(c => c.status === 'cancelled').length,
    }), [list])

    const filtered = useMemo(
        () => list.filter(c => c.status === tab),
        [list, tab],
    )

    const confirmPay = async () => {
        if (!payingTarget) return
        setProcessing(true)
        try {
            await markCheckoutPaid(payingTarget.id, paymentMethod)
            toast.success('Pagamento registrado!')
            setPayingTarget(null)
            checkouts.refetch()
            stats.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Falha ao registrar pagamento.')
        } finally {
            setProcessing(false)
        }
    }

    const confirmCancel = async () => {
        if (!cancellingTarget) return
        setProcessing(true)
        try {
            await cancelCheckout(cancellingTarget.id, 'Cancelado pela recepção')
            toast.success('Comanda cancelada.')
            setCancellingTarget(null)
            checkouts.refetch()
            stats.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Falha ao cancelar.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Recepção"
                title="Comandas e pagamentos"
                subtitle="Receba comandas enviadas pela equipe clínica e feche o atendimento do cliente."
            />

            <div className="reception-stats">
                <StatCard icon={Clock}        label="Aguardando agora"  value={counts.pending}            tone="warning" />
                <StatCard icon={CheckCircle2} label="Fechadas hoje"     value={stats.data?.paid ?? 0}     tone="success" />
                <StatCard icon={XCircle}      label="Canceladas hoje"   value={stats.data?.cancelled ?? 0} tone="muted" />
            </div>

            <Tabs
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'pending',   label: 'Aguardando', count: counts.pending   },
                    { value: 'paid',      label: 'Pagas',      count: counts.paid      },
                    { value: 'cancelled', label: 'Canceladas', count: counts.cancelled },
                ]}
            />

            <div style={{ marginTop: '1.25rem' }}>
                {checkouts.loading && <SkeletonRows rows={3} height={90} />}
                {!checkouts.loading && filtered.length === 0 && (
                    <EmptyState
                        icon={Receipt}
                        title="Nada por aqui"
                        description={
                            tab === 'pending'
                                ? 'Ainda não há comandas aguardando pagamento.'
                                : tab === 'paid'
                                    ? 'Nenhuma comanda paga registrada no período.'
                                    : 'Nenhuma comanda cancelada.'
                        }
                    />
                )}

                {filtered.map(c => (
                    <article key={c.id} className="checkout-card">
                        <div>
                            <div className="checkout-card-head">
                                <strong>
                                    <PawPrint size={14} style={{ verticalAlign: 'middle' }} /> {c.pet?.name ?? '—'}
                                </strong>
                                <Badge tone="muted"><User size={11} /> {c.owner?.name ?? '—'}</Badge>
                                <StatusBadge value={c.status} map={CHECKOUT_STATUS} />
                                <span className="checkout-card-meta">· {formatRelative(c.createdAt)}</span>
                            </div>

                            <div className="checkout-card-items">
                                {c.items.map((it, idx) => (
                                    <span key={idx} className="checkout-card-item-pill">
                                        {it.qty}× {it.name}
                                    </span>
                                ))}
                            </div>

                            {c.notes && (
                                <div style={{ marginTop: 6, fontStyle: 'italic', fontSize: 12, color: 'var(--c-gray-600)' }}>
                                    "{c.notes}"
                                </div>
                            )}

                            {c.owner?.phone && c.status === 'pending' && (
                                <a
                                    href={`tel:${c.owner.phone.replace(/\D/g,'')}`}
                                    className="checkout-card-meta"
                                    style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--brand-primary)', fontWeight: 600 }}
                                >
                                    <Phone size={11} /> {c.owner.phone}
                                </a>
                            )}
                        </div>

                        <div className="checkout-card-total">
                            <div>
                                <div className="checkout-card-total-value">{formatBRL(c.total)}</div>
                            </div>

                            {c.status === 'pending' && (
                                <div className="checkout-card-actions">
                                    <Button
                                        size="sm"
                                        variant="success"
                                        icon={CheckCircle2}
                                        onClick={() => { setPayingTarget(c); setPaymentMethod('pix') }}
                                    >
                                        Marcar como pago
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        icon={XCircle}
                                        onClick={() => setCancellingTarget(c)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>

            <Modal
                open={!!payingTarget}
                onClose={processing ? undefined : () => setPayingTarget(null)}
                size="sm"
                title="Registrar pagamento"
                description={payingTarget ? `${payingTarget.pet?.name ?? 'Pet'} — ${formatBRL(payingTarget.total)}` : ''}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setPayingTarget(null)} disabled={processing}>Cancelar</Button>
                        <Button variant="success" icon={CheckCircle2} onClick={confirmPay} loading={processing}>
                            Confirmar pagamento
                        </Button>
                    </>
                }
            >
                <FormField label="Forma de pagamento" icon={CreditCard}>
                    <SelectInput
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        options={PAYMENT_METHODS}
                    />
                </FormField>
            </Modal>

            <ConfirmDialog
                open={!!cancellingTarget}
                onClose={() => setCancellingTarget(null)}
                onConfirm={confirmCancel}
                title="Cancelar comanda?"
                description="A comanda será marcada como cancelada e não poderá ser reativada."
                confirmLabel="Sim, cancelar"
                loading={processing}
            />
        </>
    )
}
