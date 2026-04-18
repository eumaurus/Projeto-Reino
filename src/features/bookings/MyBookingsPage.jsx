import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, PawPrint, Plus, Filter, XCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { listBookingsByOwner, cancelBookingByOwner } from '../../services/bookings.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import { StatusBadge } from '../../shared/components/ui/Badge'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import Tabs from '../../shared/components/ui/Tabs'
import { useToast } from '../../shared/components/ui/Toast'
import { BOOKING_STATUS } from '../../shared/constants/statuses'
import { formatDate, formatTime, todayISO } from '../../shared/utils/dates'
import './my-bookings.css'

export default function MyBookingsPage() {
    const { currentUser } = useAuth()
    const toast = useToast()
    const query = useAsync(() => listBookingsByOwner(currentUser.id), [currentUser.id])
    const bookings = query.data ?? []

    const [tab, setTab]             = useState('upcoming')
    const [cancelTarget, setCancel] = useState(null)
    const [cancelling, setCancelling] = useState(false)

    const today = todayISO()
    const grouped = useMemo(() => ({
        upcoming: bookings.filter(b => ['pending','confirmed'].includes(b.status) && b.requestedDate >= today),
        past:     bookings.filter(b => b.status === 'done' || (b.requestedDate < today && b.status !== 'cancelled')),
        cancelled: bookings.filter(b => b.status === 'cancelled'),
    }), [bookings, today])

    const visible = grouped[tab] ?? []

    const confirmCancel = async () => {
        if (!cancelTarget) return
        setCancelling(true)
        try {
            await cancelBookingByOwner(cancelTarget.id, 'Cancelado pelo tutor')
            toast.success('Agendamento cancelado.')
            setCancel(null)
            query.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Falha ao cancelar.')
        } finally {
            setCancelling(false)
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Seus agendamentos"
                title="Compromissos do seu pet"
                subtitle="Acompanhe o status de consultas, vacinas e exames. Você pode cancelar agendamentos futuros a qualquer momento."
                actions={<Link to="/booking"><Button icon={Plus}>Novo agendamento</Button></Link>}
            />

            <Tabs
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'upcoming',  label: 'Próximos',   count: grouped.upcoming.length,  icon: Calendar },
                    { value: 'past',      label: 'Histórico',  count: grouped.past.length,      icon: Clock    },
                    { value: 'cancelled', label: 'Cancelados', count: grouped.cancelled.length, icon: XCircle  },
                ]}
            />

            <div style={{ marginTop: '1.5rem' }}>
                {query.loading && <SkeletonRows rows={3} height={80} />}
                {!query.loading && visible.length === 0 && (
                    <EmptyState
                        icon={Calendar}
                        title={tab === 'upcoming' ? 'Sem agendamentos futuros' : tab === 'past' ? 'Sem histórico ainda' : 'Nada cancelado'}
                        description={
                            tab === 'upcoming'
                                ? 'Marque uma consulta, vacinação ou exame. É rápido!'
                                : 'Seus agendamentos concluídos aparecerão aqui.'
                        }
                        action={tab === 'upcoming' && <Link to="/booking"><Button icon={Plus}>Agendar agora</Button></Link>}
                    />
                )}

                <div className="booking-list">
                    {visible.map(b => (
                        <div key={b.id} className="booking-row">
                            <div className="booking-row-date">
                                <strong>{formatDate(b.requestedDate)}</strong>
                                <span>{formatTime(b.requestedTime)}</span>
                            </div>
                            <div className="booking-row-main">
                                <div className="booking-row-head">
                                    <strong>{b.service}</strong>
                                    <StatusBadge value={b.status} map={BOOKING_STATUS} />
                                </div>
                                <div className="booking-row-meta">
                                    <span><PawPrint size={13} /> {b.pet?.name ?? '—'}</span>
                                    {b.vaccines?.length > 0 && (
                                        <span>{b.vaccines.map(v => v.name).join(', ')}</span>
                                    )}
                                </div>
                                {b.notes && <p className="booking-row-notes">“{b.notes}”</p>}
                                {b.cancelledReason && <p className="booking-row-cancel">Motivo: {b.cancelledReason}</p>}
                            </div>
                            {['pending', 'confirmed'].includes(b.status) && b.requestedDate >= today && (
                                <div className="booking-row-actions">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCancel(b)}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmDialog
                open={!!cancelTarget}
                onClose={() => setCancel(null)}
                onConfirm={confirmCancel}
                title="Cancelar agendamento?"
                description={cancelTarget ? `Tem certeza que deseja cancelar o agendamento de ${cancelTarget.service} em ${formatDate(cancelTarget.requestedDate)} às ${cancelTarget.requestedTime}? Para remarcar, crie um novo agendamento.` : ''}
                confirmLabel="Sim, cancelar"
                cancelLabel="Manter"
                loading={cancelling}
            />
        </>
    )
}
