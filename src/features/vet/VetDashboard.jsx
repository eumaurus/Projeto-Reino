import { Link } from 'react-router-dom'
import {
    CalendarDays, CalendarCheck, CalendarClock, Stethoscope, Users,
    ShieldCheck, ArrowRight, Activity, PawPrint, Microscope,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { listAllBookings, getBookingStats } from '../../services/bookings.service'
import { listRecentConsultationsByVet, countConsultations } from '../../services/consultations.service'
import { listPendingExams } from '../../services/exams.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import StatCard from '../../shared/components/ui/StatCard'
import SectionHeading from '../../shared/components/ui/SectionHeading'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../shared/components/ui/Badge'
import Button from '../../shared/components/ui/Button'
import { BOOKING_STATUS, EXAM_STATUS } from '../../shared/constants/statuses'
import { formatDate, formatTime, todayISO, addDays, toISODate, formatRelative } from '../../shared/utils/dates'
import './vet.css'

export default function VetDashboard() {
    const { currentUser } = useAuth()

    const today = todayISO()
    const nextWeek = toISODate(addDays(new Date(), 7))

    const weekBookings  = useAsync(() => listAllBookings({ from: today, to: nextWeek }), [])
    const stats         = useAsync(() => getBookingStats(), [])
    const consultations = useAsync(() => listRecentConsultationsByVet(currentUser.id, 5), [currentUser.id])
    const consultCount  = useAsync(() => countConsultations(), [])
    const pendingExams  = useAsync(() => listPendingExams(), [])

    const todayBookings = (weekBookings.data ?? []).filter(b => b.requestedDate === today)

    return (
        <>
            <PageHeader
                eyebrow="Bem-vindo(a) de volta"
                title={`Olá, Dr(a). ${currentUser?.name?.split(' ')[0] ?? ''}`}
                subtitle="Aqui está sua visão geral da clínica. Abra a agenda para confirmar consultas, registrar prontuário ou solicitar exames."
                actions={
                    <>
                        <Link to="/vet/agenda"><Button variant="outline" icon={CalendarDays}>Agenda</Button></Link>
                        <Link to="/vet/patients"><Button icon={Stethoscope}>Pacientes</Button></Link>
                    </>
                }
            />

            <div className="stat-grid">
                <StatCard icon={CalendarClock} label="Hoje"                 value={stats.data?.today ?? 0}    hint="Compromissos do dia" />
                <StatCard icon={CalendarDays}  label="Próximos 7 dias"      value={stats.data?.next7 ?? 0}   tone="info" />
                <StatCard icon={ShieldCheck}   label="Aguardando confirmação" value={stats.data?.pending ?? 0} tone="warning" />
                <StatCard icon={Stethoscope}   label="Consultas registradas"  value={consultCount.data ?? 0}   tone="success" />
            </div>

            <div className="vet-grid">
                <section>
                    <SectionHeading
                        icon={CalendarClock}
                        action={<Link to="/vet/agenda" style={{ color:'var(--brand-primary)', fontSize:'var(--fs-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ver agenda completa <ArrowRight size={14} /></Link>}
                    >
                        Agenda de hoje ({formatDate(today)})
                    </SectionHeading>

                    {weekBookings.loading && <SkeletonRows rows={3} height={60} />}
                    {!weekBookings.loading && todayBookings.length === 0 && (
                        <EmptyState icon={CalendarDays} title="Sem agendamentos hoje" description="Aproveite para revisar prontuários pendentes ou atualizar protocolos." />
                    )}
                    {todayBookings.length > 0 && (
                        <div className="stack gap-2">
                            {todayBookings.map(b => (
                                <Link key={b.id} to="/vet/agenda" className="vet-appointment">
                                    <div className="vet-appointment-time">
                                        <Clock14 />
                                        <strong>{formatTime(b.requestedTime)}</strong>
                                    </div>
                                    <div className="vet-appointment-body">
                                        <strong>{b.service}</strong>
                                        <span><PawPrint size={12} /> {b.pet?.name} · {b.owner?.name}</span>
                                    </div>
                                    <StatusBadge value={b.status} map={BOOKING_STATUS} />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <SectionHeading icon={Microscope}>
                        Exames pendentes
                    </SectionHeading>
                    {pendingExams.loading && <SkeletonRows rows={2} height={60} />}
                    {!pendingExams.loading && (pendingExams.data ?? []).length === 0 && (
                        <EmptyState icon={Microscope} title="Nenhum exame em aberto" description="Todos os exames estão concluídos ou não há solicitações pendentes." />
                    )}
                    {(pendingExams.data ?? []).length > 0 && (
                        <div className="stack gap-2">
                            {pendingExams.data.slice(0, 5).map(ex => (
                                <Link key={ex.id} to={`/vet/patients/${ex.petId}`} className="vet-exam-row">
                                    <div>
                                        <strong>{ex.type}</strong>
                                        <span>
                                            {ex.pets?.name ?? 'Pet'} · solicitado {formatRelative(ex.requestedAt)}
                                        </span>
                                    </div>
                                    <StatusBadge value={ex.status} map={EXAM_STATUS} />
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <section className="mb-8" style={{ marginTop: '2rem' }}>
                <SectionHeading icon={Activity}>
                    Últimas consultas registradas
                </SectionHeading>
                {consultations.loading && <SkeletonRows rows={2} height={50} />}
                {!consultations.loading && (consultations.data ?? []).length === 0 && (
                    <EmptyState icon={Stethoscope} title="Nenhuma consulta ainda" description="Ao registrar a primeira consulta, ela aparecerá aqui." />
                )}
                {(consultations.data ?? []).length > 0 && (
                    <div className="stack gap-2">
                        {consultations.data.map(c => (
                            <Link key={c.id} to={`/vet/patients/${c.petId}`} className="vet-consult-row">
                                <div>
                                    <strong>{c.reason || 'Consulta clínica'}</strong>
                                    <span>{c.pets?.name ?? '—'} · {formatRelative(c.consultedAt)}</span>
                                </div>
                                <ArrowRight size={16} />
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </>
    )
}

function Clock14() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
}
