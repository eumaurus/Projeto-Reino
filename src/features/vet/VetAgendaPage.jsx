import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    CalendarDays, Filter, CheckCircle2, XCircle, ClipboardList, PawPrint, Phone,
    List, LayoutGrid, Receipt,
} from 'lucide-react'
import AgendaCalendar, { DayDetail } from './AgendaCalendar'
import { useAsync } from '../../shared/hooks/useAsync'
import { listAllBookings, updateBookingStatus } from '../../services/bookings.service'
import { listCheckoutsByBooking } from '../../services/checkouts.service'
import { formatBRL } from '../../shared/utils/formatters'
import './vet.css'
import './checkout.css'
import PageHeader from '../../shared/components/ui/PageHeader'
import Tabs from '../../shared/components/ui/Tabs'
import Button from '../../shared/components/ui/Button'
import { StatusBadge } from '../../shared/components/ui/Badge'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../shared/components/ui/Toast'
import { BOOKING_STATUS } from '../../shared/constants/statuses'
import { formatDate, formatTime, weekdayName, todayISO, toISODate, addDays } from '../../shared/utils/dates'

export default function VetAgendaPage() {
    const toast = useToast()
    const [view, setView] = useState('list') // 'list' | 'calendar'
    const [selectedDay, setSelectedDay] = useState(new Date())
    const [tab, setTab] = useState('all')
    const [from, setFrom] = useState(todayISO())
    const [to,   setTo]   = useState(toISODate(addDays(new Date(), 30)))
    const [cancelling, setCancelling] = useState(null)
    const [processing, setProcessing] = useState(false)

    const query = useAsync(() => listAllBookings({ from, to }), [from, to])
    const bookings = query.data ?? []

    const bookingIds = useMemo(() => bookings.map(b => b.id), [bookings])
    const checkoutsQuery = useAsync(
        () => (bookingIds.length ? listCheckoutsByBooking(bookingIds) : Promise.resolve([])),
        [bookingIds.join(',')],
    )
    const checkoutByBooking = useMemo(() => {
        const map = new Map()
        for (const c of (checkoutsQuery.data ?? [])) {
            if (c.booking_id) map.set(c.booking_id, c)
        }
        return map
    }, [checkoutsQuery.data])

    const groups = useMemo(() => {
        const grouped = new Map()
        for (const b of bookings) {
            const key = b.requestedDate
            if (!grouped.has(key)) grouped.set(key, [])
            grouped.get(key).push(b)
        }
        return Array.from(grouped.entries()).sort(([a],[b]) => a.localeCompare(b))
    }, [bookings])

    const filteredByTab = useMemo(() => {
        return groups
            .map(([date, list]) => [date, list.filter(b => {
                if (tab === 'pending')   return b.status === 'pending'
                if (tab === 'confirmed') return b.status === 'confirmed'
                if (tab === 'done')      return b.status === 'done'
                if (tab === 'cancelled') return b.status === 'cancelled'
                return true
            })])
            .filter(([, list]) => list.length > 0)
    }, [groups, tab])

    const counts = useMemo(() => ({
        all:       bookings.length,
        pending:   bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        done:      bookings.filter(b => b.status === 'done').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    }), [bookings])

    const handleStatus = async (booking, status) => {
        if (status === 'cancelled') {
            setCancelling(booking)
            return
        }
        setProcessing(true)
        try {
            await updateBookingStatus(booking.id, status)
            toast.success(
                status === 'confirmed' ? 'Agendamento confirmado.' :
                status === 'done'      ? 'Atendimento marcado como realizado.' :
                'Status atualizado.'
            )
            query.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Não foi possível atualizar o status.')
        } finally {
            setProcessing(false)
        }
    }

    const confirmCancel = async () => {
        if (!cancelling) return
        setProcessing(true)
        try {
            await updateBookingStatus(cancelling.id, 'cancelled', { cancelled_reason: 'Cancelado pela clínica' })
            toast.success('Agendamento cancelado.')
            setCancelling(null)
            query.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Falha ao cancelar.')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Gestão clínica"
                title="Agenda da clínica"
                subtitle="Acompanhe agendamentos, confirme pedidos dos tutores e finalize consultas."
                actions={
                    <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--c-gray-100)', borderRadius: 'var(--r-md)' }}>
                        <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" icon={List} onClick={() => setView('list')}>Lista</Button>
                        <Button variant={view === 'calendar' ? 'primary' : 'ghost'} size="sm" icon={LayoutGrid} onClick={() => setView('calendar')}>Calendário</Button>
                    </div>
                }
            />

            {view === 'calendar' && (
                <>
                    <AgendaCalendar
                        bookings={bookings}
                        onPickDate={setSelectedDay}
                        selectedDate={selectedDay}
                    />
                    <DayDetail date={selectedDay} bookings={bookings} />
                </>
            )}

            {view === 'list' && (
            <>
            <div className="agenda-filters">
                <Filter size={16} color="var(--c-gray-400)" />
                <label style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>De</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <label style={{ fontSize: 13, color: 'var(--c-gray-500)' }}>Até</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                <Button variant="ghost" size="sm" onClick={() => query.refetch()}>Atualizar</Button>
            </div>

            <Tabs
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'all',       label: 'Todos',       count: counts.all       },
                    { value: 'pending',   label: 'Pendentes',   count: counts.pending   },
                    { value: 'confirmed', label: 'Confirmados', count: counts.confirmed },
                    { value: 'done',      label: 'Realizados',  count: counts.done      },
                    { value: 'cancelled', label: 'Cancelados',  count: counts.cancelled },
                ]}
            />

            <div style={{ marginTop: '1.5rem' }}>
                {query.loading && <SkeletonRows rows={4} height={70} />}
                {!query.loading && filteredByTab.length === 0 && (
                    <EmptyState
                        icon={CalendarDays}
                        title="Sem agendamentos nesse filtro"
                        description="Ajuste o intervalo de datas ou selecione outra aba para ver mais."
                    />
                )}

                {filteredByTab.map(([date, list]) => (
                    <div key={date} className="agenda-day">
                        <div className="agenda-day-title">
                            <CalendarDays size={16} /> {weekdayName(date, true)}, {formatDate(date)}
                            <span className="agenda-day-count">{list.length} {list.length === 1 ? 'agendamento' : 'agendamentos'}</span>
                        </div>

                        {list.map(b => (
                            <div key={b.id} className="agenda-card">
                                <div className="agenda-card-time">{formatTime(b.requestedTime)}</div>

                                <div className="agenda-card-body">
                                    <strong>{b.service}</strong>
                                    <span style={{ display: 'block' }}>
                                        <PawPrint size={12} style={{ verticalAlign: 'middle' }} /> {b.pet?.name ?? '—'} · {b.owner?.name ?? '—'}
                                    </span>
                                    {b.vaccines?.length > 0 && (
                                        <span style={{ color: 'var(--c-gray-500)', fontSize: 12, display: 'block', marginTop: 2 }}>
                                            {b.vaccines.map(v => v.name).join(', ')}
                                        </span>
                                    )}
                                    {b.notes && (
                                        <span style={{ display: 'block', marginTop: 4, fontStyle: 'italic', color: 'var(--c-gray-600)' }}>
                                            “{b.notes}”
                                        </span>
                                    )}
                                </div>

                                <div>
                                    {b.owner?.phone && (
                                        <a href={`tel:${b.owner.phone.replace(/\D/g,'')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600 }}>
                                            <Phone size={12} /> {b.owner.phone}
                                        </a>
                                    )}
                                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                                        <StatusBadge value={b.status} map={BOOKING_STATUS} />
                                        {checkoutByBooking.get(b.id)?.status === 'pending' && (
                                            <span className="checkout-pending-chip">
                                                <Receipt size={11} /> Aguardando pagto · {formatBRL(checkoutByBooking.get(b.id).total)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="agenda-card-actions">
                                    {b.status === 'pending' && (
                                        <>
                                            <Button size="sm" variant="success" icon={CheckCircle2} onClick={() => handleStatus(b, 'confirmed')}>Confirmar</Button>
                                            <Button size="sm" variant="outline" icon={XCircle} onClick={() => handleStatus(b, 'cancelled')}>Cancelar</Button>
                                        </>
                                    )}
                                    {b.status === 'confirmed' && (
                                        <>
                                            <Button size="sm" variant="primary" icon={CheckCircle2} onClick={() => handleStatus(b, 'done')}>Concluir</Button>
                                            <Link to={`/vet/patients/${b.petId}/consultations/new?bookingId=${b.id}`}>
                                                <Button size="sm" variant="outline" icon={ClipboardList}>Atender</Button>
                                            </Link>
                                            <Button size="sm" variant="ghost" onClick={() => handleStatus(b, 'cancelled')}>Cancelar</Button>
                                        </>
                                    )}
                                    {['done','cancelled'].includes(b.status) && (
                                        <Link to={`/vet/patients/${b.petId}`}>
                                            <Button size="sm" variant="ghost">Ver paciente</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            </>
            )}

            <ConfirmDialog
                open={!!cancelling}
                onClose={() => setCancelling(null)}
                onConfirm={confirmCancel}
                title="Cancelar agendamento?"
                description={cancelling ? `Isso cancelará o agendamento de ${cancelling.service} em ${formatDate(cancelling.requestedDate)}. O tutor receberá uma notificação automática.` : ''}
                confirmLabel="Sim, cancelar"
                loading={processing}
            />
        </>
    )
}
