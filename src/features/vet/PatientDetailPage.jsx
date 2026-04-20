import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, PawPrint, Cat, Dog, Stethoscope, Syringe, FileText,
    Microscope, ClipboardList, Edit3, Plus, User, Phone, Weight,
    Hash, Check, Calendar, CalendarClock, ShieldCheck, BadgeCheck,
    Printer, Thermometer, Heart, ChevronRight,
} from 'lucide-react'
import { downloadPrescriptionPdf } from '../../shared/utils/pdf/prescriptionPdf'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { listConsultationsByPet } from '../../services/consultations.service'
import { listPrescriptionsByPet } from '../../services/prescriptions.service'
import { listExamsByPet, updateExam } from '../../services/exams.service'
import Button from '../../shared/components/ui/Button'
import Tabs from '../../shared/components/ui/Tabs'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { StatusBadge } from '../../shared/components/ui/Badge'
import SearchBox from '../../shared/components/ui/SearchBox'
import { formatDate, formatDateLong, formatTime } from '../../shared/utils/dates'
import { EXAM_STATUS } from '../../shared/constants/statuses'
import { useToast } from '../../shared/components/ui/Toast'
import EditPetModal from './EditPetModal'
import VaccineRegistrationModal from './VaccineRegistrationModal'
import EditVaccineModal from './EditVaccineModal'
import './vet.css'
import './patient-detail.css'

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const speciesIcon = (s) => {
    const v = (s ?? '').toLowerCase()
    if (v.startsWith('cat') || v.startsWith('gat')) return Cat
    if (v.startsWith('cach') || v.startsWith('dog')) return Dog
    return PawPrint
}

const normalize = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

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
                {tab === 'vaccines'      && <VaccinesBlock pet={pet} onRegister={() => setVaccineOpen(true)} onRefresh={() => petQuery.refetch()} />}
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

/* ─── DatePill: destaque de data à esquerda do card ─── */
function DatePill({ isoDate }) {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return null
    return (
        <div className="pd-date-pill">
            <span className="pd-date-pill-day">{String(d.getDate()).padStart(2, '0')}</span>
            <span className="pd-date-pill-month">{MONTHS_SHORT[d.getMonth()]}</span>
            <span className="pd-date-pill-year">{d.getFullYear()}</span>
            <span className="pd-date-pill-time">{formatTime(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`)}</span>
        </div>
    )
}

/* ─── FilterBar ─── */
function FilterBar({ value, onChange, total, filtered, placeholder }) {
    const showCount = value && filtered !== total
    return (
        <div className="pd-filter-bar">
            <SearchBox value={value} onChange={onChange} placeholder={placeholder} />
            <span className="pd-filter-count">
                {showCount
                    ? <><strong>{filtered}</strong> de {total}</>
                    : <>Total: <strong>{total}</strong></>}
            </span>
        </div>
    )
}

/* ─── Consultas ─── */
function ConsultationsBlock({ petId }) {
    const { data, loading } = useAsync(() => listConsultationsByPet(petId), [petId])
    const [search, setSearch] = useState('')

    const all = data ?? []
    const filtered = useMemo(() => {
        const q = normalize(search)
        if (!q) return all
        return all.filter(c =>
            normalize(c.reason).includes(q) ||
            normalize(c.anamnesis).includes(q) ||
            normalize(c.procedures).includes(q) ||
            normalize(c.diagnosis).includes(q) ||
            normalize(c.treatment).includes(q) ||
            normalize(c.notes).includes(q) ||
            normalize(c.vet?.name).includes(q)
        )
    }, [all, search])

    if (loading) return <SkeletonRows rows={2} height={120} />
    if (all.length === 0) {
        return <EmptyState icon={Stethoscope} title="Sem consultas registradas" description="Registre a primeira consulta deste paciente." />
    }

    return (
        <>
            <FilterBar
                value={search}
                onChange={setSearch}
                total={all.length}
                filtered={filtered.length}
                placeholder="Buscar por motivo, diagnóstico, vet..."
            />
            {filtered.length === 0 && (
                <EmptyState icon={Stethoscope} title="Nenhuma consulta encontrada" description="Tente outros termos ou limpe a busca." />
            )}
            {filtered.map(c => (
                <Link
                    key={c.id}
                    to={`/vet/patients/${c.petId}/consultations/${c.id}`}
                    className="pd-consultation pd-consultation-link"
                >
                    <DatePill isoDate={c.consultedAt} />
                    <div className="pd-body">
                        <div className="pd-head">
                            <div>
                                <h3 className="pd-head-title">{c.reason || 'Consulta clínica'}</h3>
                                <div className="pd-head-meta">
                                    {c.vet?.name && (
                                        <span className="pd-head-vet">
                                            <BadgeCheck size={12} /> Dr(a). {c.vet.name}
                                            {c.vet.crmv ? ` · CRMV ${c.vet.crmv}` : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="pd-open-hint">Abrir <ChevronRight size={13} /></span>
                        </div>

                        {(c.weightKg || c.temperatureC || c.heartRate) && (
                            <div className="pd-vitals">
                                {c.weightKg     != null && <span className="pd-vital-pill"><Weight      size={12} /> {c.weightKg} kg</span>}
                                {c.temperatureC != null && <span className="pd-vital-pill"><Thermometer size={12} /> {c.temperatureC} °C</span>}
                                {c.heartRate    != null && <span className="pd-vital-pill"><Heart       size={12} /> {c.heartRate} bpm</span>}
                            </div>
                        )}

                        <div className="pd-sections">
                            {c.anamnesis  && <Section label="Anamnese"      text={c.anamnesis} />}
                            {c.procedures && <Section label="Procedimentos" text={c.procedures} />}
                            {c.diagnosis  && <Section label="Diagnóstico"   text={c.diagnosis} />}
                            {c.treatment  && <Section label="Tratamento"    text={c.treatment} />}
                            {c.notes      && <Section label="Observações"   text={c.notes} />}
                        </div>
                    </div>
                </Link>
            ))}
        </>
    )
}

/* ─── Vacinas ─── */
function VaccinesBlock({ pet, onRegister, onRefresh }) {
    const [search, setSearch] = useState('')
    const [editTarget, setEditTarget] = useState(null)

    // Mantém o índice original no array do pet (necessário para editar/remover)
    const allIndexed = (pet.vaccines ?? [])
        .map((v, originalIndex) => ({ v, originalIndex }))
        .sort((a, b) => (b.v.date || '').localeCompare(a.v.date || ''))

    const filtered = useMemo(() => {
        const q = normalize(search)
        if (!q) return allIndexed
        return allIndexed.filter(({ v }) => normalize(v.name).includes(q) || normalize(v.vet).includes(q))
    }, [allIndexed, search])

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
                <Button icon={Plus} onClick={onRegister}>Registrar vacina</Button>
            </div>

            {allIndexed.length === 0 ? (
                <EmptyState icon={Syringe} title="Nenhuma vacina registrada" description="Use 'Registrar vacina' para começar o protocolo." />
            ) : (
                <>
                    <FilterBar
                        value={search}
                        onChange={setSearch}
                        total={allIndexed.length}
                        filtered={filtered.length}
                        placeholder="Buscar vacina ou veterinário..."
                    />
                    {filtered.length === 0 && (
                        <EmptyState icon={Syringe} title="Nenhuma vacina encontrada" description="Tente outros termos." />
                    )}
                    {filtered.map(({ v, originalIndex }) => {
                        const overdue = v.nextDue && new Date(v.nextDue) < new Date()
                        return (
                            <button
                                key={`${v.name}-${originalIndex}`}
                                type="button"
                                className="pd-vaccine pd-vaccine-clickable"
                                onClick={() => setEditTarget({ v, originalIndex })}
                            >
                                <DatePill isoDate={v.date} />
                                <div className="pd-vaccine-info">
                                    <strong><ShieldCheck size={13} style={{ verticalAlign: 'middle', color: 'var(--brand-primary)' }} /> {v.name}</strong>
                                    <div className="pd-vaccine-info-meta">
                                        <span><Calendar size={12} /> Aplicada em <strong>{formatDate(v.date)}</strong></span>
                                        {v.nextDue && <span><CalendarClock size={12} /> Reforço em <strong>{formatDate(v.nextDue)}</strong></span>}
                                        {v.vet && <span><BadgeCheck size={12} /> {v.vet}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <StatusBadge
                                        value={overdue ? 'overdue' : 'ok'}
                                        map={{
                                            ok:      { label: 'Em dia', tone: 'success' },
                                            overdue: { label: 'Vencida', tone: 'danger'  },
                                        }}
                                    />
                                    <span className="pd-open-hint">Editar <ChevronRight size={13} /></span>
                                </div>
                            </button>
                        )
                    })}
                </>
            )}

            <EditVaccineModal
                open={!!editTarget}
                onClose={() => setEditTarget(null)}
                pet={pet}
                vaccine={editTarget?.v}
                index={editTarget?.originalIndex}
                onSaved={() => { setEditTarget(null); onRefresh?.() }}
            />
        </>
    )
}

/* ─── Receitas ─── */
function PrescriptionsBlock({ pet }) {
    const { data, loading } = useAsync(() => listPrescriptionsByPet(pet.id), [pet.id])
    const [search, setSearch] = useState('')

    const all = data ?? []
    const filtered = useMemo(() => {
        const q = normalize(search)
        if (!q) return all
        return all.filter(p =>
            normalize(p.vet?.name).includes(q) ||
            normalize(p.instructions).includes(q) ||
            (p.items ?? []).some(it =>
                normalize(it.name).includes(q) ||
                normalize(it.dosage).includes(q) ||
                normalize(it.notes).includes(q)
            )
        )
    }, [all, search])

    const handlePrint = (e, p) => {
        e.preventDefault()
        e.stopPropagation()
        downloadPrescriptionPdf({ prescription: p, pet, owner: pet.owner })
    }

    if (loading) return <SkeletonRows rows={2} height={100} />
    if (all.length === 0) {
        return <EmptyState icon={FileText} title="Nenhuma receita" description="Prescreva a primeira receita pelo botão 'Nova receita'." />
    }

    return (
        <>
            <FilterBar
                value={search}
                onChange={setSearch}
                total={all.length}
                filtered={filtered.length}
                placeholder="Buscar por medicamento ou veterinário..."
            />
            {filtered.length === 0 && (
                <EmptyState icon={FileText} title="Nenhuma receita encontrada" description="Tente outros termos." />
            )}
            {filtered.map(p => (
                <Link
                    key={p.id}
                    to={`/vet/patients/${pet.id}/prescriptions/${p.id}`}
                    className="pd-prescription pd-consultation-link"
                >
                    <div className="pd-head" style={{ alignItems: 'center' }}>
                        <div>
                            <h3 className="pd-head-title">Receita de {formatDateLong(p.issuedAt)}</h3>
                            {p.vet?.name && (
                                <div className="pd-head-meta">
                                    <span className="pd-head-vet">
                                        <BadgeCheck size={12} /> Dr(a). {p.vet.name}{p.vet.crmv ? ` · CRMV ${p.vet.crmv}` : ''}
                                    </span>
                                    {p.validUntil && (
                                        <span>· Válida até <strong>{formatDate(p.validUntil)}</strong></span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <Button size="sm" variant="outline" icon={Printer} onClick={(e) => handlePrint(e, p)}>Imprimir</Button>
                            <span className="pd-open-hint">Abrir <ChevronRight size={13} /></span>
                        </div>
                    </div>

                    <div className="pd-prescription-items">
                        {(p.items ?? []).map((it, i) => (
                            <div key={i} className="pd-prescription-item">
                                <strong>{it.name}</strong>
                                <div className="pd-prescription-item-meta">
                                    {it.dosage    && <span>Dose: <em>{it.dosage}</em></span>}
                                    {it.frequency && <span>Frequência: <em>{it.frequency}</em></span>}
                                    {it.duration  && <span>Duração: <em>{it.duration}</em></span>}
                                </div>
                                {it.notes && <p>{it.notes}</p>}
                            </div>
                        ))}
                    </div>

                    {p.instructions && (
                        <div className="pd-sections">
                            <Section label="Instruções gerais" text={p.instructions} />
                        </div>
                    )}
                </Link>
            ))}
        </>
    )
}

/* ─── Exames ─── */
function ExamsBlock({ pet }) {
    const toast = useToast()
    const query = useAsync(() => listExamsByPet(pet.id), [pet.id])
    const [busy, setBusy] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const all = query.data ?? []
    const filtered = useMemo(() => {
        const q = normalize(search)
        return all.filter(ex => {
            if (statusFilter !== 'all' && ex.status !== statusFilter) return false
            if (!q) return true
            return (
                normalize(ex.type).includes(q) ||
                normalize(ex.category).includes(q) ||
                normalize(ex.results).includes(q) ||
                normalize(ex.conclusion).includes(q)
            )
        })
    }, [all, search, statusFilter])

    const setStatus = async (e, exam, status) => {
        e.preventDefault()
        e.stopPropagation()
        setBusy(exam.id)
        try {
            await updateExam(exam.id, { status })
            toast.success('Status atualizado.')
            query.refetch()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setBusy(null)
        }
    }

    if (query.loading) return <SkeletonRows rows={2} height={90} />
    if (all.length === 0) {
        return <EmptyState icon={Microscope} title="Nenhum exame" description="Solicite o primeiro exame com 'Solicitar exame'." />
    }

    return (
        <>
            <FilterBar
                value={search}
                onChange={setSearch}
                total={all.length}
                filtered={filtered.length}
                placeholder="Buscar por tipo, resultado..."
            />
            <Tabs
                value={statusFilter}
                onChange={setStatusFilter}
                items={[
                    { value: 'all',         label: 'Todos',        count: all.length },
                    { value: 'requested',   label: 'Solicitados',  count: all.filter(e => e.status === 'requested').length },
                    { value: 'in_progress', label: 'Em andamento', count: all.filter(e => e.status === 'in_progress').length },
                    { value: 'completed',   label: 'Concluídos',   count: all.filter(e => e.status === 'completed').length },
                ]}
            />
            <div style={{ marginTop: '1rem' }}>
                {filtered.length === 0 && (
                    <EmptyState icon={Microscope} title="Nenhum exame nesse filtro" description="Ajuste o termo ou status para ver mais." />
                )}
                {filtered.map(ex => (
                    <Link
                        key={ex.id}
                        to={`/vet/patients/${pet.id}/exams/${ex.id}`}
                        className="pd-exam pd-consultation-link"
                    >
                        <div className="pd-head">
                            <div>
                                <h3 className="pd-head-title">{ex.type}</h3>
                                <div className="pd-head-meta">
                                    <span>{ex.category} · solicitado em <strong>{formatDate(ex.requestedAt)}</strong></span>
                                    {ex.completedAt && <span>· concluído em <strong>{formatDate(ex.completedAt)}</strong></span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <StatusBadge value={ex.status} map={EXAM_STATUS} />
                                {ex.status === 'requested'   && <Button size="sm" variant="outline" loading={busy===ex.id} onClick={(e) => setStatus(e, ex, 'in_progress')}>Iniciar</Button>}
                                {ex.status === 'in_progress' && <Button size="sm" variant="success" icon={Check} loading={busy===ex.id} onClick={(e) => setStatus(e, ex, 'completed')}>Concluir</Button>}
                                <span className="pd-open-hint">Abrir <ChevronRight size={13} /></span>
                            </div>
                        </div>
                        {(ex.results || ex.conclusion) && (
                            <div className="pd-sections">
                                {ex.results    && <Section label="Resultados" text={ex.results} />}
                                {ex.conclusion && <Section label="Conclusão"  text={ex.conclusion} />}
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </>
    )
}

/* ─── Info ─── */
function InfoBlock({ pet }) {
    return (
        <div className="pd-info-grid">
            <div>
                <span className="pd-info-item-label">Nome</span>
                <div className="pd-info-item-value">{pet.name}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Espécie</span>
                <div className="pd-info-item-value">{pet.species}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Raça</span>
                <div className="pd-info-item-value">{pet.breed || '—'}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Idade</span>
                <div className="pd-info-item-value">{pet.age || '—'}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Peso</span>
                <div className="pd-info-item-value">{pet.weight || '—'}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Nascimento</span>
                <div className="pd-info-item-value">{pet.birthDate ? formatDate(pet.birthDate) : '—'}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Código</span>
                <div className="pd-info-item-value">#{pet.id}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Tutor</span>
                <div className="pd-info-item-value">{pet.owner?.name || '—'}</div>
            </div>
            <div>
                <span className="pd-info-item-label">Telefone</span>
                <div className="pd-info-item-value">{pet.owner?.phone || '—'}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
                <span className="pd-info-item-label">Observações</span>
                <div className="pd-info-item-value" style={{ whiteSpace: 'pre-wrap' }}>{pet.notes || '—'}</div>
            </div>
        </div>
    )
}

function Section({ label, text }) {
    return (
        <div className="pd-section">
            <span className="pd-section-label">{label}</span>
            <p className="pd-section-text">{text}</p>
        </div>
    )
}
