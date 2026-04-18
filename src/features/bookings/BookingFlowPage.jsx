import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
    CheckCircle2, Calendar as CalendarIcon, Clock, ChevronLeft, PawPrint,
    Stethoscope, Syringe, Microscope, Scissors, Droplets, Home, ActivitySquare,
    Check, AlertCircle, Sparkles,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { listPetsByOwner } from '../../services/pets.service'
import { listServices } from '../../services/catalog.service'
import { createBooking } from '../../services/bookings.service'
import { vaccinesBySpecies } from '../../shared/constants/vaccines'
import { getAvailableTimeSlots, getNextBusinessDays, formatDateShort, weekdayName, formatDate, toISODate } from '../../shared/utils/dates'
import Button from '../../shared/components/ui/Button'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { useToast } from '../../shared/components/ui/Toast'
import './booking-flow.css'

const ICON_MAP = {
    Stethoscope, Syringe, Microscope, Scissors, Droplets, Home, ActivitySquare,
    PawPrint, Sparkles,
}

const STEPS = [
    { key: 'pet',      label: 'Pet'      },
    { key: 'service',  label: 'Serviço'  },
    { key: 'vaccines', label: 'Vacinas', conditional: true },
    { key: 'datetime', label: 'Data'     },
    { key: 'review',   label: 'Revisão'  },
]

export default function BookingFlowPage() {
    const { currentUser } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    const petsQuery     = useAsync(() => listPetsByOwner(currentUser.id), [currentUser.id])
    const servicesQuery = useAsync(() => listServices({ onlyActive: true }), [])

    const pets     = petsQuery.data     ?? []
    const services = servicesQuery.data ?? []

    const [stepIdx,  setStepIdx]   = useState(0)
    const [petId,    setPetId]     = useState(null)
    const [serviceId, setServiceId] = useState(null)
    const [vaccineIds, setVaccineIds] = useState([])
    const [date,     setDate]      = useState(null)
    const [time,     setTime]      = useState(null)
    const [notes,    setNotes]     = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [createdBooking, setCreatedBooking] = useState(null)

    useEffect(() => {
        const paramPet = searchParams.get('petId')
        if (paramPet && pets.length && !petId) {
            if (pets.find(p => p.id === paramPet)) setPetId(paramPet)
        }
    }, [pets, petId, searchParams])

    const pet     = pets.find(p => p.id === petId)
    const service = services.find(s => s.id === serviceId)
    const isVaccineFlow = serviceId === 'vacina'

    const activeSteps = STEPS.filter(s => !s.conditional || isVaccineFlow)
    const currentStep = activeSteps[stepIdx]

    const canGoNext = (() => {
        if (!currentStep) return false
        switch (currentStep.key) {
            case 'pet':      return !!petId
            case 'service':  return !!serviceId
            case 'vaccines': return vaccineIds.length > 0
            case 'datetime': return !!date && !!time
            case 'review':   return true
            default: return false
        }
    })()

    const next = () => { if (canGoNext) setStepIdx(i => Math.min(i + 1, activeSteps.length - 1)) }
    const prev = () => setStepIdx(i => Math.max(i - 1, 0))

    const availableVaccines = pet ? vaccinesBySpecies(pet.species) : []

    const timeSlots = date ? getAvailableTimeSlots(date) : []

    const submit = async () => {
        setSubmitting(true)
        try {
            const selectedVaccines = vaccineIds
                .map(id => availableVaccines.find(v => v.id === id))
                .filter(Boolean)
                .map(v => ({ id: v.id, name: v.name }))

            const booking = await createBooking({
                ownerId:       currentUser.id,
                petId,
                service:       service.name,
                vaccines:      selectedVaccines,
                requestedDate: toISODate(date),
                requestedTime: time,
                notes:         notes.trim() || null,
            })
            setCreatedBooking(booking)
            toast.success('Agendamento enviado! Aguarde a confirmação.')
        } catch (e) {
            toast.error(e.message ?? 'Falha ao criar agendamento.')
        } finally {
            setSubmitting(false)
        }
    }

    if (createdBooking) {
        return (
            <div className="booking-success">
                <div className="booking-success-icon">
                    <CheckCircle2 size={44} />
                </div>
                <h1>Agendamento enviado!</h1>
                <p>Recebemos seu pedido e em breve a equipe confirmará pelo portal e pelo WhatsApp.</p>

                <div className="booking-success-summary">
                    <div>
                        <small>Serviço</small>
                        <strong>{service.name}</strong>
                    </div>
                    <div>
                        <small>Data & hora</small>
                        <strong>{formatDate(createdBooking.requestedDate)} às {createdBooking.requestedTime}</strong>
                    </div>
                    <div>
                        <small>Protocolo</small>
                        <strong>#{createdBooking.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                </div>

                <div className="booking-success-actions">
                    <Link to="/bookings"><Button variant="outline">Ver meus agendamentos</Button></Link>
                    <Button
                        onClick={() => {
                            setCreatedBooking(null)
                            setStepIdx(0); setPetId(null); setServiceId(null)
                            setVaccineIds([]); setDate(null); setTime(null); setNotes('')
                        }}
                        icon={CalendarIcon}
                    >
                        Fazer outro
                    </Button>
                </div>
            </div>
        )
    }

    if (petsQuery.loading || servicesQuery.loading) {
        return <SkeletonRows rows={6} height={40} />
    }

    if (!pets.length) {
        return (
            <EmptyState
                icon={PawPrint}
                title="Você precisa vincular um pet antes de agendar"
                description="Volte ao início e use a opção 'Vincular pet' para começar."
                action={<Button onClick={() => navigate('/dashboard')}>Voltar ao início</Button>}
            />
        )
    }

    return (
        <div className="booking-flow">
            <header className="booking-flow-header">
                <button className="booking-flow-back" onClick={prev} disabled={stepIdx === 0}>
                    <ChevronLeft size={16} /> {stepIdx === 0 ? 'Início' : 'Voltar'}
                </button>
                <div className="booking-flow-steps">
                    {activeSteps.map((s, i) => (
                        <div
                            key={s.key}
                            className={`booking-step ${i === stepIdx ? 'active' : ''} ${i < stepIdx ? 'done' : ''}`}
                        >
                            <div className="booking-step-dot">{i < stepIdx ? <Check size={14} /> : i + 1}</div>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </header>

            {currentStep?.key === 'pet' && (
                <section className="booking-step-content">
                    <h2>Para qual pet é esse agendamento?</h2>
                    <p className="booking-step-subtitle">Selecione o pet que receberá o atendimento.</p>
                    <div className="booking-grid">
                        {pets.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                className={`booking-option-card ${petId === p.id ? 'selected' : ''}`}
                                onClick={() => setPetId(p.id)}
                            >
                                {p.image
                                    ? <img src={p.image} alt={p.name} className="booking-option-pet-img" />
                                    : <div className="booking-option-pet-img empty"><PawPrint size={28} /></div>
                                }
                                <strong>{p.name}</strong>
                                <span>{p.breed ?? p.species}</span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {currentStep?.key === 'service' && (
                <section className="booking-step-content">
                    <h2>Qual serviço você precisa?</h2>
                    <p className="booking-step-subtitle">Conheça nossa equipe completa no atendimento {pet?.name}.</p>
                    <div className="booking-grid">
                        {services.map(s => {
                            const Icon = ICON_MAP[s.icon] ?? Sparkles
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`booking-option-card ${serviceId === s.id ? 'selected' : ''}`}
                                    onClick={() => setServiceId(s.id)}
                                >
                                    <div className="booking-option-icon"><Icon size={22} /></div>
                                    <strong>{s.name}</strong>
                                    <span>{s.description}</span>
                                    {s.duration && <small>≈ {s.duration} min</small>}
                                </button>
                            )
                        })}
                    </div>
                </section>
            )}

            {currentStep?.key === 'vaccines' && (
                <section className="booking-step-content">
                    <h2>Quais vacinas vão ser aplicadas?</h2>
                    <p className="booking-step-subtitle">Selecione uma ou mais opções. A equipe confirma o protocolo no atendimento.</p>
                    <div className="booking-vaccine-list">
                        {availableVaccines.map(v => {
                            const selected = vaccineIds.includes(v.id)
                            return (
                                <button
                                    key={v.id}
                                    type="button"
                                    className={`booking-vaccine-item ${selected ? 'selected' : ''}`}
                                    onClick={() => setVaccineIds(list => selected ? list.filter(i => i !== v.id) : [...list, v.id])}
                                >
                                    <div className="booking-vaccine-check">
                                        {selected ? <Check size={14} /> : null}
                                    </div>
                                    <div>
                                        <strong>{v.name}</strong>
                                        <span>Reforço a cada {v.boosterMonths === 12 ? '12 meses' : `${v.boosterMonths} meses`}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>
            )}

            {currentStep?.key === 'datetime' && (
                <section className="booking-step-content">
                    <h2>Escolha data e horário</h2>
                    <p className="booking-step-subtitle">Funcionamos de segunda a sábado. Domingos ficamos fechados.</p>
                    <div className="booking-datetime">
                        <div>
                            <h3>Dia</h3>
                            <div className="booking-calendar">
                                {getNextBusinessDays(14).map(d => {
                                    const iso = toISODate(d)
                                    const selected = toISODate(date) === iso
                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            className={`booking-day ${selected ? 'selected' : ''}`}
                                            onClick={() => { setDate(d); setTime(null) }}
                                        >
                                            <span>{weekdayName(d)}</span>
                                            <strong>{formatDateShort(d)}</strong>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <h3>Horário</h3>
                            {!date && <div className="booking-hint">Escolha uma data para ver os horários disponíveis.</div>}
                            {date && (
                                <div className="booking-times">
                                    {timeSlots.length === 0 && <div className="booking-hint">Sem horários neste dia.</div>}
                                    {timeSlots.map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`booking-time ${time === t ? 'selected' : ''}`}
                                            onClick={() => setTime(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {currentStep?.key === 'review' && (
                <section className="booking-step-content">
                    <h2>Confirme os detalhes</h2>
                    <p className="booking-step-subtitle">Revise tudo antes de enviar o pedido.</p>

                    <div className="booking-review">
                        <ReviewRow label="Pet" value={`${pet?.name} · ${pet?.species}`} />
                        <ReviewRow label="Serviço" value={service?.name} />
                        {isVaccineFlow && (
                            <ReviewRow
                                label="Vacinas"
                                value={vaccineIds.map(id => availableVaccines.find(v => v.id === id)?.name).filter(Boolean).join(', ')}
                            />
                        )}
                        <ReviewRow label="Data e hora" value={`${formatDate(date)} às ${time}`} />
                        {service?.duration && <ReviewRow label="Duração aproximada" value={`${service.duration} min`} />}

                        <div className="booking-notes">
                            <label htmlFor="notes">Observações (opcional)</label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Sintomas, dúvidas, preferências..."
                            />
                        </div>

                        <div className="alert alert-info" style={{ marginTop: 16 }}>
                            <AlertCircle size={16} />
                            <div>
                                Seu agendamento entra em status <strong>Aguardando confirmação</strong>. A equipe confirma pelo WhatsApp ou pelo próprio portal.
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <footer className="booking-flow-footer">
                {stepIdx > 0 && (
                    <Button variant="outline" onClick={prev}>Voltar</Button>
                )}
                {stepIdx < activeSteps.length - 1 && (
                    <Button onClick={next} disabled={!canGoNext}>
                        Continuar
                    </Button>
                )}
                {stepIdx === activeSteps.length - 1 && (
                    <Button onClick={submit} loading={submitting} icon={CheckCircle2} size="lg">
                        Confirmar agendamento
                    </Button>
                )}
            </footer>
        </div>
    )
}

function ReviewRow({ label, value }) {
    return (
        <div className="booking-review-row">
            <small>{label}</small>
            <strong>{value || '—'}</strong>
        </div>
    )
}
