import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    PawPrint, Plus, Calendar, ShieldCheck, Phone, MessageCircle,
    CalendarCheck, Syringe, ArrowRight, Sparkles, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { listPetsByOwner } from '../../services/pets.service'
import { listBookingsByOwner } from '../../services/bookings.service'
import Button from '../../shared/components/ui/Button'
import StatCard from '../../shared/components/ui/StatCard'
import EmptyState from '../../shared/components/ui/EmptyState'
import SectionHeading from '../../shared/components/ui/SectionHeading'
import { SkeletonCards } from '../../shared/components/ui/Skeleton'
import { CLINIC } from '../../shared/constants/clinic'
import { BOOKING_STATUS } from '../../shared/constants/statuses'
import { formatDate, formatTime, todayISO } from '../../shared/utils/dates'
import { StatusBadge } from '../../shared/components/ui/Badge'
import PetCard from '../pets/PetCard'
import AddPetModal from '../pets/AddPetModal'
import './client-dashboard.css'

export default function ClientDashboard() {
    const { currentUser } = useAuth()
    const [addOpen, setAddOpen] = useState(false)

    const petsQuery     = useAsync(() => listPetsByOwner(currentUser.id), [currentUser.id])
    const bookingsQuery = useAsync(() => listBookingsByOwner(currentUser.id), [currentUser.id])

    const pets     = petsQuery.data     ?? []
    const bookings = bookingsQuery.data ?? []

    const upcomingBookings = useMemo(() => {
        const today = todayISO()
        return bookings
            .filter(b => ['pending','confirmed'].includes(b.status) && b.requestedDate >= today)
            .slice(0, 3)
    }, [bookings])

    const vaccineAlerts = useMemo(() => {
        const today = new Date()
        const in30  = new Date(); in30.setDate(in30.getDate() + 30)
        const alerts = []
        for (const pet of pets) {
            for (const v of pet.vaccines ?? []) {
                if (!v.nextDue) continue
                const due = new Date(v.nextDue)
                if (Number.isNaN(due.getTime())) continue
                const overdue = due < today
                const soon    = !overdue && due <= in30
                if (overdue || soon) {
                    alerts.push({ pet, vaccine: v, overdue })
                }
            }
        }
        return alerts.sort((a, b) => (a.vaccine.nextDue || '').localeCompare(b.vaccine.nextDue || ''))
    }, [pets])

    const hi = useMemo(() => {
        const h = new Date().getHours()
        if (h < 12) return 'Bom dia'
        if (h < 18) return 'Boa tarde'
        return 'Boa noite'
    }, [])

    return (
        <>
            <section className="dash-hero">
                <div className="dash-hero-left">
                    <div className="dash-hero-eyebrow">
                        <Sparkles size={13} /> Portal do tutor
                    </div>
                    <h1>{hi}, {currentUser?.name?.split(' ')[0] ?? 'tutor(a)'} 👋</h1>
                    <p>Acompanhe a saúde dos seus pets, agende consultas e visualize o prontuário completo em um só lugar.</p>
                    <div className="dash-hero-actions">
                        <Link to="/booking">
                            <Button variant="primary" icon={Calendar}>Agendar consulta</Button>
                        </Link>
                        <Button variant="outline" icon={Plus} onClick={() => setAddOpen(true)}>Vincular pet</Button>
                    </div>
                </div>
                <div className="dash-hero-right">
                    <a href={CLINIC.whatsappHref} target="_blank" rel="noreferrer" className="dash-hero-shortcut">
                        <div className="dash-hero-shortcut-icon"><MessageCircle size={18} /></div>
                        <div>
                            <strong>WhatsApp</strong>
                            <span>{CLINIC.whatsapp}</span>
                        </div>
                    </a>
                    <a href={`tel:${CLINIC.phone.replace(/\D/g,'')}`} className="dash-hero-shortcut">
                        <div className="dash-hero-shortcut-icon"><Phone size={18} /></div>
                        <div>
                            <strong>Telefone</strong>
                            <span>{CLINIC.phone}</span>
                        </div>
                    </a>
                </div>
            </section>

            <div className="stat-grid">
                <StatCard
                    icon={PawPrint}
                    label="Pets cadastrados"
                    value={pets.length}
                    hint={pets.length ? 'Ver perfis abaixo' : 'Vincule seu primeiro pet'}
                />
                <StatCard
                    icon={CalendarCheck}
                    label="Agendamentos ativos"
                    value={upcomingBookings.length}
                    hint={upcomingBookings.length ? 'Próximos compromissos' : 'Nenhum agendado'}
                    tone="info"
                />
                <StatCard
                    icon={Syringe}
                    label="Alertas de vacina"
                    value={vaccineAlerts.length}
                    hint={vaccineAlerts.length ? 'Renovar em breve' : 'Tudo em dia'}
                    tone={vaccineAlerts.length ? 'warning' : 'success'}
                />
            </div>

            {vaccineAlerts.length > 0 && (
                <div className="dash-vaccine-alerts">
                    <SectionHeading icon={AlertTriangle}>
                        Vacinas com prazo próximo
                    </SectionHeading>
                    <div className="stack gap-2">
                        {vaccineAlerts.slice(0, 4).map(({ pet, vaccine, overdue }, idx) => (
                            <div key={`${pet.id}-${vaccine.name}-${idx}`} className={`vaccine-alert ${overdue ? 'overdue' : ''}`}>
                                <div className={`vaccine-alert-icon ${overdue ? 'overdue' : ''}`}>
                                    <Syringe size={16} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <strong>{vaccine.name}</strong> — {pet.name}
                                    <span> · reforço previsto para {formatDate(vaccine.nextDue)}</span>
                                </div>
                                <Link to="/booking">
                                    <Button variant="outline" size="sm">Agendar</Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <section className="mb-8" style={{ marginTop: '2rem' }}>
                <SectionHeading
                    icon={PawPrint}
                    action={
                        <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddOpen(true)}>
                            Vincular pet
                        </Button>
                    }
                >
                    Meus pets
                </SectionHeading>

                {petsQuery.loading && <SkeletonCards count={3} />}
                {!petsQuery.loading && pets.length === 0 && (
                    <EmptyState
                        icon={PawPrint}
                        title="Nenhum pet vinculado ainda"
                        description="Peça à recepção o código do seu pet no Reino Animal para vincular e começar a usar o portal."
                        action={<Button icon={Plus} onClick={() => setAddOpen(true)}>Vincular meu primeiro pet</Button>}
                    />
                )}
                {!petsQuery.loading && pets.length > 0 && (
                    <div className="portal-cards-grid">
                        {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
                    </div>
                )}
            </section>

            <section className="mb-8">
                <SectionHeading
                    icon={Calendar}
                    action={
                        <Link to="/bookings" style={{ color: 'var(--brand-primary)', fontSize: 'var(--fs-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    }
                >
                    Próximos agendamentos
                </SectionHeading>

                {bookingsQuery.loading && (
                    <div className="stack gap-2"><div className="skeleton" style={{ height: 80 }} /><div className="skeleton" style={{ height: 80 }} /></div>
                )}
                {!bookingsQuery.loading && upcomingBookings.length === 0 && (
                    <EmptyState
                        icon={Calendar}
                        title="Nenhum agendamento futuro"
                        description="Que tal marcar uma consulta ou renovar as vacinas do seu pet?"
                        action={<Link to="/booking"><Button icon={Calendar}>Agendar consulta</Button></Link>}
                    />
                )}
                {upcomingBookings.length > 0 && (
                    <div className="stack gap-2">
                        {upcomingBookings.map(b => (
                            <div key={b.id} className="booking-line">
                                <div className="booking-line-date">
                                    <strong>{formatDate(b.requestedDate)}</strong>
                                    <span>{formatTime(b.requestedTime)}</span>
                                </div>
                                <div className="booking-line-body">
                                    <strong>{b.service}</strong>
                                    <span>{b.pet?.name ?? '—'}</span>
                                </div>
                                <StatusBadge value={b.status} map={BOOKING_STATUS} />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <AddPetModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                ownerId={currentUser.id}
                onCreated={() => petsQuery.refetch()}
            />
        </>
    )
}
