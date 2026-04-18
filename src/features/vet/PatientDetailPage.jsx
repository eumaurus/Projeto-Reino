import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, PawPrint, Cat, Dog, Stethoscope, Syringe, FileText,
    Microscope, ClipboardList, Edit3, Plus, User, Phone, Weight,
    Cake, Hash, Check, Calendar, CalendarClock, ShieldCheck, BadgeCheck,
    Printer, Download,
} from 'lucide-react'
import { downloadPrescriptionPdf } from '../../shared/utils/pdf/prescriptionPdf'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById, savePet } from '../../services/pets.service'
import { listConsultationsByPet } from '../../services/consultations.service'
import { listPrescriptionsByPet } from '../../services/prescriptions.service'
import { listExamsByPet, updateExam } from '../../services/exams.service'
import Button from '../../shared/components/ui/Button'
import Tabs from '../../shared/components/ui/Tabs'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../shared/components/ui/Badge'
import { formatDate, formatDateTime, formatDateLong } from '../../shared/utils/dates'
import { EXAM_STATUS } from '../../shared/constants/statuses'
import { formatDocument } from '../../shared/utils/masks'
import { useToast } from '../../shared/components/ui/Toast'
import EditPetModal from './EditPetModal'
import VaccineRegistrationModal from './VaccineRegistrationModal'

const speciesIcon = (s) => {
    const v = (s ?? '').toLowerCase()
    if (v.startsWith('cat') || v.startsWith('gat')) return Cat
    if (v.startsWith('cach') || v.startsWith('dog')) return Dog
    return PawPrint
}

export default function PatientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const petQuery = useAsync(() => getPetById(id), [id])
    const [tab, setTab] = useState('consultations')
    const [editOpen,    setEditOpen]    = useState(false)
    const [vaccineOpen, setVaccineOpen] = useState(false)

    const pet = petQuery.data
    const Icon = pet ? speciesIcon(pet.species) : PawPrint

    if (petQuery.loading) return <SkeletonRows rows={6} height={40} />

    if (!pet) return (
        <EmptyState
            icon={PawPrint}
            title="Paciente não encontrado"
            description="O pet solicitado não existe ou foi removido."
            action={<Button variant="outline" onClick={() => navigate('/vet/patients')}>Voltar</Button>}
        />
    )

    return (
        <>
            <Link to="/vet/patients" className="breadcrumbs">
                <ArrowLeft size={14} /> Pacientes
            </Link>

            <div className="patient-detail-hero">
                <div className="patient-detail-hero-photo">
                    {pet.image ? <img src={pet.image} alt={pet.name} /> : <Icon size={44} />}
                </div>
                <div>
                    <h1>{pet.name}</h1>
                    <p>{pet.breed ?? 'SRD'}{pet.age ? ` · ${pet.age}` : ''}{pet.weight ? ` · ${pet.weight}` : ''}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span className="patient-detail-owner">
                            <User size={12} /> {pet.owner?.name ?? '—'}
                        </span>
                        {pet.owner?.phone && (
                            <a href={`tel:${pet.owner.phone.replace(/\D/g,'')}`} className="patient-detail-owner">
                                <Phone size={12} /> {pet.owner.phone}
                            </a>
                        )}
                        <span className="patient-detail-owner">
                            <Hash size={12} /> {pet.id}
                        </span>
                    </div>
                </div>
                <div className="patient-detail-actions">
                    <Link to={`/vet/patients/${pet.id}/consultations/new`}>
                        <Button icon={ClipboardList}>Nova consulta</Button>
                    </Link>
                    <Link to={`/vet/patients/${pet.id}/prescriptions/new`}>
                        <Button variant="outline" icon={FileText}>Nova receita</Button>
                    </Link>
                    <Link to={`/vet/patients/${pet.id}/exams/new`}>
                        <Button variant="outline" icon={Microscope}>Solicitar exame</Button>
                    </Link>
                    <Button variant="outline" icon={Syringe} onClick={() => setVaccineOpen(true)}>Registrar vacina</Button>
                    <Button variant="ghost" icon={Edit3} onClick={() => setEditOpen(true)}>Editar ficha</Button>
                </div>
            </div>

            <Tabs
                value={tab}
                onChange={setTab}
                items={[
                    { value: 'consultations', label: 'Consultas',     icon: Stethoscope },
                    { value: 'vaccines',      label: 'Vacinas',       icon: Syringe },
                    { value: 'prescriptions', label: 'Receitas',      icon: FileText },
                    { value: 'exams',         label: 'Exames',        icon: Microscope },
                    { value: 'info',          label: 'Informações',   icon: ClipboardList },
                ]}
            />

            <div style={{ marginTop: '1.25rem' }}>
                {tab === 'consultations' && <ConsultationsBlock petId={pet.id} />}
                {tab === 'vaccines'      && <VaccinesBlock pet={pet} onRegister={() => setVaccineOpen(true)} />}
                {tab === 'prescriptions' && <PrescriptionsBlock pet={pet} />}
                {tab === 'exams'         && <ExamsBlock pet={pet} />}
                {tab === 'info'          && <InfoBlock pet={pet} />}
            </div>

            <EditPetModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                pet={pet}
                onSaved={() => { setEditOpen(false); petQuery.refetch(); }}
            />

            <VaccineRegistrationModal
                open={vaccineOpen}
                onClose={() => setVaccineOpen(false)}
                pet={pet}
                onSaved={() => { setVaccineOpen(false); petQuery.refetch(); toast.success('Vacinas registradas.') }}
            />
        </>
    )
}

function ConsultationsBlock({ petId }) {
    const { data, loading } = useAsync(() => listConsultationsByPet(petId), [petId])
    if (loading) return <SkeletonRows rows={2} height={70} />
    if (!data?.length) return <EmptyState icon={Stethoscope} title="Sem consultas registradas" description="Registre a primeira consulta deste paciente." />
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
                            {c.weightKg     && <span><Weight size={13} /> {c.weightKg} kg</span>}
                            {c.temperatureC && <span>🌡 {c.temperatureC} °C</span>}
                            {c.heartRate    && <span>💓 {c.heartRate} bpm</span>}
                        </div>
                    )}
                    {c.anamnesis  && <Section title="Anamnese"      text={c.anamnesis} />}
                    {c.procedures && <Section title="Procedimentos" text={c.procedures} />}
                    {c.diagnosis  && <Section title="Diagnóstico"   text={c.diagnosis} />}
                    {c.treatment  && <Section title="Tratamento"    text={c.treatment} />}
                    {c.notes      && <Section title="Observações"   text={c.notes} />}
                </article>
            ))}
        </div>
    )
}

function VaccinesBlock({ pet, onRegister }) {
    const vaccines = (pet.vaccines ?? []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''))
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <Button icon={Plus} onClick={onRegister}>Registrar vacina</Button>
            </div>

            {vaccines.length === 0
                ? <EmptyState icon={Syringe} title="Nenhuma vacina registrada" description="Use 'Registrar vacina' para começar o protocolo." />
                : (
                    <div className="vaccine-timeline">
                        {vaccines.map((v, i) => {
                            const overdue = v.nextDue && new Date(v.nextDue) < new Date()
                            return (
                                <div key={`${v.name}-${i}`} className="vaccine-timeline-item">
                                    <div className="vaccine-timeline-dot"><ShieldCheck size={14} /></div>
                                    <div className="vaccine-timeline-card">
                                        <div className="vaccine-timeline-head">
                                            <strong>{v.name}</strong>
                                            <StatusBadge value={overdue ? 'overdue' : 'ok'} map={{ ok: { label: 'Em dia', tone: 'success' }, overdue: { label: 'Vencida', tone: 'danger' } }} />
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
        </>
    )
}

function PrescriptionsBlock({ pet }) {
    const { data, loading } = useAsync(() => listPrescriptionsByPet(pet.id), [pet.id])
    if (loading) return <SkeletonRows rows={2} height={60} />
    if (!data?.length) return <EmptyState icon={FileText} title="Nenhuma receita" description="Prescreva a primeira receita pelo botão 'Nova receita'." />

    const handlePrint = (p) => {
        downloadPrescriptionPdf({ prescription: p, pet, owner: pet.owner })
    }

    return (
        <div className="stack gap-3">
            {data.map(p => (
                <article key={p.id} className="prescription-card">
                    <header>
                        <div>
                            <strong>Receita de {formatDateLong(p.issuedAt)}</strong>
                            {p.vet?.name && <span>Dr(a). {p.vet.name}{p.vet.crmv ? ` · CRMV ${p.vet.crmv}` : ''}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {p.validUntil && <span className="prescription-valid">Válida até {formatDate(p.validUntil)}</span>}
                            <Button size="sm" variant="outline" icon={Printer} onClick={() => handlePrint(p)}>Imprimir</Button>
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

function ExamsBlock({ pet }) {
    const toast = useToast()
    const query = useAsync(() => listExamsByPet(pet.id), [pet.id])
    const [busy, setBusy] = useState(null)

    const setStatus = async (exam, status) => {
        setBusy(exam.id)
        try {
            await updateExam(exam.id, { status })
            toast.success('Status atualizado.')
            query.refetch()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setBusy(null)
        }
    }

    if (query.loading) return <SkeletonRows rows={2} height={60} />
    if (!query.data?.length) return <EmptyState icon={Microscope} title="Nenhum exame" description="Solicite o primeiro exame com 'Solicitar exame'." />

    return (
        <div className="stack gap-3">
            {query.data.map(ex => (
                <article key={ex.id} className="exam-card">
                    <header>
                        <div>
                            <strong>{ex.type}</strong>
                            <span>{ex.category} · {formatDate(ex.requestedAt)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <StatusBadge value={ex.status} map={EXAM_STATUS} />
                            {ex.status === 'requested'    && <Button size="sm" variant="outline" loading={busy===ex.id} onClick={() => setStatus(ex, 'in_progress')}>Iniciar</Button>}
                            {ex.status === 'in_progress'  && <Button size="sm" variant="success" icon={Check} loading={busy===ex.id} onClick={() => setStatus(ex, 'completed')}>Concluir</Button>}
                        </div>
                    </header>
                    {ex.results    && <Section title="Resultados" text={ex.results} />}
                    {ex.conclusion && <Section title="Conclusão"  text={ex.conclusion} />}
                </article>
            ))}
        </div>
    )
}

function InfoBlock({ pet }) {
    return (
        <div className="info-grid card">
            <div>
                <span className="info-item-label">Nome</span>
                <div className="info-item-value">{pet.name}</div>
            </div>
            <div>
                <span className="info-item-label">Espécie</span>
                <div className="info-item-value">{pet.species}</div>
            </div>
            <div>
                <span className="info-item-label">Raça</span>
                <div className="info-item-value">{pet.breed || '—'}</div>
            </div>
            <div>
                <span className="info-item-label">Idade</span>
                <div className="info-item-value">{pet.age || '—'}</div>
            </div>
            <div>
                <span className="info-item-label">Peso</span>
                <div className="info-item-value">{pet.weight || '—'}</div>
            </div>
            <div>
                <span className="info-item-label">Nascimento</span>
                <div className="info-item-value">{pet.birthDate ? formatDate(pet.birthDate) : '—'}</div>
            </div>
            <div>
                <span className="info-item-label">Código</span>
                <div className="info-item-value">#{pet.id}</div>
            </div>
            <div>
                <span className="info-item-label">Tutor</span>
                <div className="info-item-value">{pet.owner?.name || '—'}</div>
            </div>
            <div>
                <span className="info-item-label">Telefone</span>
                <div className="info-item-value">{pet.owner?.phone || '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
                <span className="info-item-label">Observações</span>
                <div className="info-item-value" style={{ whiteSpace: 'pre-wrap' }}>{pet.notes || '—'}</div>
            </div>
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
