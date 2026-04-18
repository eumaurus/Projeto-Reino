import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, PawPrint, Cat, Dog, Calendar, Weight, Cake,
    Syringe, Stethoscope, FileText, Microscope, ShieldCheck,
    BadgeCheck, Info, Hash, Clock, ClipboardList, CalendarClock,
    Printer, Download,
} from 'lucide-react'
import { downloadPrescriptionPdf } from '../../shared/utils/pdf/prescriptionPdf'
import { downloadMedicalRecordPdf } from '../../shared/utils/pdf/medicalRecordPdf'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { listConsultationsByPet } from '../../services/consultations.service'
import { listPrescriptionsByPet } from '../../services/prescriptions.service'
import { listExamsByPet } from '../../services/exams.service'
import Button from '../../shared/components/ui/Button'
import Tabs from '../../shared/components/ui/Tabs'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../shared/components/ui/Badge'
import { formatDate, formatDateTime, formatDateLong } from '../../shared/utils/dates'
import { EXAM_STATUS } from '../../shared/constants/statuses'
import './pet-profile.css'

const speciesIcon = (s) => {
    const v = (s ?? '').toLowerCase()
    if (v.startsWith('cat') || v.startsWith('gat')) return Cat
    if (v.startsWith('cach') || v.startsWith('dog')) return Dog
    return PawPrint
}

export default function PetProfilePage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [tab, setTab] = useState('overview')

    const petQuery = useAsync(() => getPetById(id), [id])

    const pet = petQuery.data
    const Icon = pet ? speciesIcon(pet.species) : PawPrint

    if (petQuery.loading) {
        return <SkeletonRows rows={6} height={30} />
    }
    if (!pet) {
        return (
            <EmptyState
                icon={PawPrint}
                title="Pet não encontrado"
                description="Esse código não está vinculado a nenhum pet ou você não tem acesso a ele."
                action={<Button variant="outline" onClick={() => navigate('/dashboard')}>Voltar ao início</Button>}
            />
        )
    }

    return (
        <div className="pet-profile">
            <Link to="/dashboard" className="breadcrumbs">
                <ArrowLeft size={14} /> Meus pets
            </Link>

            <header className="pet-profile-hero">
                <div className="pet-profile-cover">
                    {pet.image
                        ? <img src={pet.image} alt={pet.name} />
                        : <Icon size={72} />
                    }
                </div>
                <div className="pet-profile-meta">
                    <div className="pet-profile-chip">
                        <Icon size={12} /> {pet.species}
                    </div>
                    <h1>{pet.name}</h1>
                    <p>{pet.breed ?? 'Sem raça definida'}{pet.age ? ` · ${pet.age}` : ''}</p>
                    <div className="pet-profile-stats">
                        <div>
                            <Weight size={14} />
                            <span>
                                <small>Peso</small>
                                <strong>{pet.weight ?? '—'}</strong>
                            </span>
                        </div>
                        <div>
                            <Cake size={14} />
                            <span>
                                <small>Nascimento</small>
                                <strong>{pet.birthDate ? formatDate(pet.birthDate) : '—'}</strong>
                            </span>
                        </div>
                        <div>
                            <Hash size={14} />
                            <span>
                                <small>Código</small>
                                <strong>#{pet.id}</strong>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="pet-profile-actions">
                    <Link to={`/booking?petId=${pet.id}`}>
                        <Button icon={Calendar}>Agendar</Button>
                    </Link>
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={async () => {
                            const [consultations, prescriptions, exams] = await Promise.all([
                                listConsultationsByPet(pet.id),
                                listPrescriptionsByPet(pet.id),
                                listExamsByPet(pet.id),
                            ])
                            downloadMedicalRecordPdf({
                                pet, owner: pet.owner,
                                consultations, prescriptions, exams,
                            })
                        }}
                    >
                        Baixar prontuário
                    </Button>
                </div>
            </header>

            <Tabs
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'overview',      label: 'Visão geral',  icon: ClipboardList },
                    { value: 'vaccines',      label: 'Vacinas',      icon: Syringe     },
                    { value: 'consultations', label: 'Consultas',    icon: Stethoscope },
                    { value: 'exams',         label: 'Exames',       icon: Microscope  },
                    { value: 'prescriptions', label: 'Receitas',     icon: FileText    },
                ]}
            />

            <div style={{ marginTop: '1.5rem' }}>
                {tab === 'overview'      && <OverviewTab pet={pet} />}
                {tab === 'vaccines'      && <VaccinesTab  pet={pet} />}
                {tab === 'consultations' && <ConsultationsTab pet={pet} />}
                {tab === 'exams'         && <ExamsTab pet={pet} />}
                {tab === 'prescriptions' && <PrescriptionsTab pet={pet} />}
            </div>
        </div>
    )
}

/* ─── Tab: Overview ─────────────────────────────────────── */
function OverviewTab({ pet }) {
    const consultations = useAsync(() => listConsultationsByPet(pet.id), [pet.id])
    const lastConsultation = consultations.data?.[0]
    const nextVaccine = (pet.vaccines ?? [])
        .filter(v => v.nextDue)
        .sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || ''))[0]

    return (
        <div className="pet-overview">
            <div className="pet-overview-item">
                <div className="pet-overview-item-icon"><Stethoscope size={18} /></div>
                <div>
                    <small>Última consulta</small>
                    {lastConsultation
                        ? (
                            <strong>
                                {formatDate(lastConsultation.consultedAt)}
                                {lastConsultation.reason && ` · ${lastConsultation.reason}`}
                            </strong>
                        )
                        : <strong>Ainda não registrada</strong>
                    }
                </div>
            </div>

            <div className="pet-overview-item">
                <div className="pet-overview-item-icon"><Syringe size={18} /></div>
                <div>
                    <small>Próxima vacina</small>
                    {nextVaccine
                        ? <strong>{nextVaccine.name} · {formatDate(nextVaccine.nextDue)}</strong>
                        : <strong>Nenhuma pendente</strong>
                    }
                </div>
            </div>

            <div className="pet-overview-item">
                <div className="pet-overview-item-icon"><Info size={18} /></div>
                <div>
                    <small>Observações do tutor</small>
                    <strong>{pet.notes || 'Sem observações cadastradas.'}</strong>
                </div>
            </div>
        </div>
    )
}

/* ─── Tab: Vaccines ─────────────────────────────────────── */
function VaccinesTab({ pet }) {
    const vaccines = (pet.vaccines ?? []).slice().sort((a,b) => (b.date || '').localeCompare(a.date || ''))
    if (!vaccines.length) {
        return (
            <EmptyState
                icon={Syringe}
                title="Nenhuma vacina registrada"
                description="Após cada aplicação, o veterinário registra a vacina no prontuário. Agende uma consulta para começar o protocolo."
            />
        )
    }
    return (
        <div className="vaccine-timeline">
            {vaccines.map((v, i) => {
                const overdue = v.nextDue && new Date(v.nextDue) < new Date()
                return (
                    <div key={`${v.name}-${v.date}-${i}`} className="vaccine-timeline-item">
                        <div className="vaccine-timeline-dot"><ShieldCheck size={14} /></div>
                        <div className="vaccine-timeline-card">
                            <div className="vaccine-timeline-head">
                                <strong>{v.name}</strong>
                                <StatusBadge
                                    value={overdue ? 'overdue' : 'ok'}
                                    map={{
                                        ok:      { label: 'Em dia',     tone: 'success' },
                                        overdue: { label: 'Vencida',    tone: 'danger'  },
                                    }}
                                />
                            </div>
                            <div className="vaccine-timeline-meta">
                                <span><Calendar size={13} /> Aplicada em <strong>{formatDate(v.date)}</strong></span>
                                {v.nextDue && <span><CalendarClock size={13} /> Reforço em <strong>{formatDate(v.nextDue)}</strong></span>}
                                {v.vet && <span><BadgeCheck size={13} /> {v.vet}</span>}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ─── Tab: Consultations ─────────────────────────────────── */
function ConsultationsTab({ pet }) {
    const { data, loading } = useAsync(() => listConsultationsByPet(pet.id), [pet.id])
    if (loading) return <SkeletonRows rows={3} height={80} />
    if (!data?.length) {
        return (
            <EmptyState
                icon={Stethoscope}
                title="Nenhuma consulta registrada"
                description="Assim que o veterinário(a) registrar atendimentos, o histórico aparecerá aqui."
            />
        )
    }
    return (
        <div className="stack gap-3">
            {data.map(c => (
                <article key={c.id} className="consultation-card">
                    <header>
                        <div>
                            <strong>{c.reason || 'Consulta clínica'}</strong>
                            <span>{formatDateTime(c.consultedAt)}</span>
                        </div>
                        {c.vet?.name && <span className="consultation-vet">Dr(a). {c.vet.name}</span>}
                    </header>

                    {(c.weightKg || c.temperatureC || c.heartRate) && (
                        <div className="consultation-vitals">
                            {c.weightKg      && <span><Weight size={13} /> {c.weightKg} kg</span>}
                            {c.temperatureC  && <span>🌡 {c.temperatureC} °C</span>}
                            {c.heartRate     && <span>💓 {c.heartRate} bpm</span>}
                        </div>
                    )}

                    {c.anamnesis  && <Section title="Anamnese"    text={c.anamnesis} />}
                    {c.procedures && <Section title="Procedimentos" text={c.procedures} />}
                    {c.diagnosis  && <Section title="Diagnóstico" text={c.diagnosis} />}
                    {c.treatment  && <Section title="Tratamento"  text={c.treatment} />}
                    {c.notes      && <Section title="Observações"  text={c.notes} />}
                </article>
            ))}
        </div>
    )
}

function Section({ title, text }) {
    return (
        <div className="consultation-section">
            <span>{title}</span>
            <p>{text}</p>
        </div>
    )
}

/* ─── Tab: Exams ────────────────────────────────────────── */
function ExamsTab({ pet }) {
    const { data, loading } = useAsync(() => listExamsByPet(pet.id), [pet.id])
    if (loading) return <SkeletonRows rows={3} height={60} />
    if (!data?.length) {
        return (
            <EmptyState
                icon={Microscope}
                title="Nenhum exame registrado"
                description="Exames solicitados ou realizados ficam disponíveis aqui junto com o resultado."
            />
        )
    }
    return (
        <div className="stack gap-3">
            {data.map(ex => (
                <article key={ex.id} className="exam-card">
                    <header>
                        <div>
                            <strong>{ex.type}</strong>
                            <span>{ex.category} · solicitado em {formatDate(ex.requestedAt)}</span>
                        </div>
                        <StatusBadge value={ex.status} map={EXAM_STATUS} />
                    </header>
                    {ex.results    && <Section title="Resultados" text={ex.results} />}
                    {ex.conclusion && <Section title="Conclusão"   text={ex.conclusion} />}
                    {ex.fileUrl && (
                        <a href={ex.fileUrl} target="_blank" rel="noreferrer" className="exam-file-link">
                            Ver arquivo anexado
                        </a>
                    )}
                </article>
            ))}
        </div>
    )
}

/* ─── Tab: Prescriptions ─────────────────────────────────── */
function PrescriptionsTab({ pet }) {
    const { data, loading } = useAsync(() => listPrescriptionsByPet(pet.id), [pet.id])
    if (loading) return <SkeletonRows rows={3} height={70} />
    if (!data?.length) {
        return (
            <EmptyState
                icon={FileText}
                title="Nenhuma receita emitida"
                description="As receitas prescritas pelo veterinário(a) aparecem aqui e podem ser impressas a qualquer momento."
            />
        )
    }
    return (
        <div className="stack gap-3">
            {data.map(p => (
                <article key={p.id} className="prescription-card">
                    <header>
                        <div>
                            <strong>Receita de {formatDateLong(p.issuedAt)}</strong>
                            {p.vet?.name && <span>Prescrita por Dr(a). {p.vet.name}{p.vet.crmv ? ` · CRMV ${p.vet.crmv}` : ''}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {p.validUntil && <span className="prescription-valid">Válida até {formatDate(p.validUntil)}</span>}
                            <Button
                                size="sm"
                                variant="outline"
                                icon={Download}
                                onClick={() => downloadPrescriptionPdf({ prescription: p, pet, owner: pet.owner })}
                            >
                                Baixar PDF
                            </Button>
                        </div>
                    </header>
                    <ul className="prescription-items">
                        {(p.items ?? []).map((it, i) => (
                            <li key={i}>
                                <strong>{it.name}</strong>
                                <div>
                                    {it.dosage     && <span>Dose: <em>{it.dosage}</em></span>}
                                    {it.frequency  && <span>Frequência: <em>{it.frequency}</em></span>}
                                    {it.duration   && <span>Duração: <em>{it.duration}</em></span>}
                                </div>
                                {it.notes && <p>{it.notes}</p>}
                            </li>
                        ))}
                    </ul>
                    {p.instructions && <Section title="Instruções gerais" text={p.instructions} />}
                </article>
            ))}
        </div>
    )
}
