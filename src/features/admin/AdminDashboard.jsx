import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
    Users, PawPrint, CalendarDays, DollarSign, TrendingUp, Stethoscope,
    Microscope, FileText, CalendarCheck, ArrowRight, Briefcase,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { listAllPets } from '../../services/pets.service'
import { listClients, listStaff } from '../../services/profiles.service'
import { listAllBookings, getBookingStats } from '../../services/bookings.service'
import { countConsultations } from '../../services/consultations.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import StatCard from '../../shared/components/ui/StatCard'
import SectionHeading from '../../shared/components/ui/SectionHeading'
import Button from '../../shared/components/ui/Button'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import EmptyState from '../../shared/components/ui/EmptyState'
import { StatusBadge } from '../../shared/components/ui/Badge'
import { BOOKING_STATUS } from '../../shared/constants/statuses'
import { formatBRL } from '../../shared/utils/formatters'
import { formatDate, formatTime, todayISO, toISODate, addDays } from '../../shared/utils/dates'
import {
    BookingsTrendChart, ServicesDistributionChart, StatusBreakdownChart, RevenueTrendChart,
} from './AnalyticsCharts'
import './admin.css'

export default function AdminDashboard() {
    const stats      = useAsync(() => getBookingStats(), [])
    const clients    = useAsync(() => listClients(), [])
    const staff      = useAsync(() => listStaff(), [])
    const pets       = useAsync(() => listAllPets(), [])
    const consCount  = useAsync(() => countConsultations(), [])
    const upcoming   = useAsync(() => listAllBookings({
        from: todayISO(),
        to:   toISODate(addDays(new Date(), 30)),
    }), [])

    const estimatedRevenue = useMemo(() => {
        const done = (upcoming.data ?? []).filter(b => b.status === 'done')
        // simple heuristic: average R$ 180 per consulta completed this month
        return done.length * 180
    }, [upcoming.data])

    return (
        <>
            <PageHeader
                eyebrow="Painel administrativo"
                title="Visão geral da clínica"
                subtitle="Acompanhe o desempenho da operação, a saúde da base de clientes e tome decisões com dados."
                actions={
                    <>
                        <Link to="/admin/clients"><Button variant="outline" icon={Users}>Clientes</Button></Link>
                        <Link to="/vet/agenda"><Button icon={CalendarDays}>Agenda</Button></Link>
                    </>
                }
            />

            <div className="stat-grid">
                <StatCard icon={Users}         label="Tutores ativos"         value={clients.data?.length ?? 0} hint="Clientes cadastrados" />
                <StatCard icon={PawPrint}      label="Pets cadastrados"       value={pets.data?.length ?? 0} tone="info" />
                <StatCard icon={CalendarCheck} label="Agendamentos no mês"   value={upcoming.data?.length ?? 0} tone="success" />
                <StatCard icon={Stethoscope}   label="Consultas registradas" value={consCount.data ?? 0} />
            </div>

            <div className="stat-grid" style={{ marginTop: '1rem' }}>
                <StatCard icon={DollarSign}  label="Receita estimada (mês)" value={formatBRL(estimatedRevenue)} hint="Baseado em consultas realizadas" tone="success" />
                <StatCard icon={TrendingUp}  label="Aguardando confirmação" value={stats.data?.pending ?? 0} hint="Ação necessária" tone="warning" />
                <StatCard icon={Briefcase}   label="Equipe"                  value={staff.data?.length ?? 0} hint="Veterinários e admins" tone="info" />
            </div>

            <div className="admin-grid">
                <section>
                    <SectionHeading
                        icon={CalendarDays}
                        action={
                            <Link to="/vet/agenda" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                                Ver tudo <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
                            </Link>
                        }
                    >
                        Próximos agendamentos
                    </SectionHeading>

                    {upcoming.loading && <SkeletonRows rows={3} height={60} />}
                    {!upcoming.loading && (upcoming.data ?? []).length === 0 && (
                        <EmptyState icon={CalendarDays} title="Sem agendamentos" description="Não há agendamentos nos próximos 30 dias." />
                    )}
                    {(upcoming.data ?? []).slice(0, 6).map(b => (
                        <Link key={b.id} to="/vet/agenda" className="vet-appointment" style={{ marginBottom: 8 }}>
                            <div className="vet-appointment-time">
                                <span style={{ fontSize: 10, color: 'var(--c-gray-500)' }}>{formatDate(b.requestedDate)}</span>
                                <strong>{formatTime(b.requestedTime)}</strong>
                            </div>
                            <div className="vet-appointment-body">
                                <strong>{b.service}</strong>
                                <span>{b.pet?.name} · {b.owner?.name}</span>
                            </div>
                            <StatusBadge value={b.status} map={BOOKING_STATUS} />
                        </Link>
                    ))}
                </section>

                <section>
                    <StatusBreakdownChart stats={stats.data} />
                </section>
            </div>

            <div className="charts-grid">
                <BookingsTrendChart bookings={upcoming.data ?? []} />
                <ServicesDistributionChart bookings={upcoming.data ?? []} />
            </div>

            <div style={{ marginTop: '1.25rem' }}>
                <RevenueTrendChart bookings={upcoming.data ?? []} />
            </div>
        </>
    )
}
