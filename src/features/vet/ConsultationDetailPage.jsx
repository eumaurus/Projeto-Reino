import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, Edit3, Save, X, Stethoscope, BadgeCheck, Weight,
    Thermometer, Heart,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { getConsultationById, updateConsultation } from '../../services/consultations.service'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import Alert from '../../shared/components/ui/Alert'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { useToast } from '../../shared/components/ui/Toast'
import { formatDateTime } from '../../shared/utils/dates'
import './vet.css'
import './patient-detail.css'

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function DatePill({ isoDate }) {
    const d = new Date(isoDate)
    if (Number.isNaN(d.getTime())) return null
    const pad = (n) => String(n).padStart(2, '0')
    return (
        <div className="pd-date-pill">
            <span className="pd-date-pill-day">{pad(d.getDate())}</span>
            <span className="pd-date-pill-month">{MONTHS_SHORT[d.getMonth()]}</span>
            <span className="pd-date-pill-year">{d.getFullYear()}</span>
            <span className="pd-date-pill-time">{pad(d.getHours())}:{pad(d.getMinutes())}</span>
        </div>
    )
}

export default function ConsultationDetailPage() {
    const { petId, consultationId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const petQuery = useAsync(() => getPetById(petId), [petId])
    const consQuery = useAsync(() => getConsultationById(consultationId), [consultationId])

    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(null)

    useEffect(() => {
        if (consQuery.data && !form) {
            const c = consQuery.data
            setForm({
                reason:       c.reason       ?? '',
                anamnesis:    c.anamnesis    ?? '',
                procedures:   c.procedures   ?? '',
                diagnosis:    c.diagnosis    ?? '',
                treatment:    c.treatment    ?? '',
                notes:        c.notes        ?? '',
                weightKg:     c.weightKg     ?? '',
                temperatureC: c.temperatureC ?? '',
                heartRate:    c.heartRate    ?? '',
            })
        }
    }, [consQuery.data, form])

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const cancelEdit = () => {
        const c = consQuery.data
        setForm({
            reason:       c.reason       ?? '',
            anamnesis:    c.anamnesis    ?? '',
            procedures:   c.procedures   ?? '',
            diagnosis:    c.diagnosis    ?? '',
            treatment:    c.treatment    ?? '',
            notes:        c.notes        ?? '',
            weightKg:     c.weightKg     ?? '',
            temperatureC: c.temperatureC ?? '',
            heartRate:    c.heartRate    ?? '',
        })
        setEditing(false)
    }

    const save = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await updateConsultation(consultationId, {
                reason:       form.reason.trim(),
                anamnesis:    form.anamnesis.trim(),
                procedures:   form.procedures.trim(),
                diagnosis:    form.diagnosis.trim(),
                treatment:    form.treatment.trim(),
                notes:        form.notes.trim(),
                weightKg:     form.weightKg === '' ? null : Number(String(form.weightKg).replace(',', '.')),
                temperatureC: form.temperatureC === '' ? null : Number(String(form.temperatureC).replace(',', '.')),
                heartRate:    form.heartRate === '' ? null : Number(form.heartRate),
            })
            toast.success('Prontuário atualizado.')
            setEditing(false)
            consQuery.refetch()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao atualizar prontuário.')
        } finally {
            setSaving(false)
        }
    }

    if (petQuery.loading || consQuery.loading) return <SkeletonRows rows={6} height={40} />

    const pet = petQuery.data
    const c = consQuery.data

    if (!pet || !c) {
        return <Alert tone="danger">Consulta não encontrada.</Alert>
    }

    return (
        <>
            <Link to={`/vet/patients/${pet.id}`} className="breadcrumbs">
                <ArrowLeft size={14} /> {pet.name} · Consultas
            </Link>

            <div className="pd-mini-hero">
                <div>
                    <div className="pd-mini-hero-eyebrow">PRONTUÁRIO · {pet.name} · {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</div>
                    <div className="pd-mini-hero-meta">Registrada em {formatDateTime(c.consultedAt)}{c.vet?.name ? ` por Dr(a). ${c.vet.name}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {editing ? (
                        <>
                            <Button variant="outline" icon={X} onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                            <Button icon={Save} onClick={save} loading={saving}>Salvar alterações</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/vet/patients/${pet.id}`)}>Voltar</Button>
                            <Button icon={Edit3} onClick={() => setEditing(true)}>Editar</Button>
                        </>
                    )}
                </div>
            </div>

            {editing ? (
                <form className="clinical-form" onSubmit={save} style={{ marginTop: '0.5rem' }}>
                    <FormField label="Motivo da consulta" icon={Stethoscope} htmlFor="reason">
                        <input id="reason" value={form.reason} onChange={set('reason')} />
                    </FormField>

                    <div className="clinical-form-row">
                        <FormField label="Peso (kg)"             htmlFor="c-weight"><input id="c-weight" value={form.weightKg} onChange={set('weightKg')} /></FormField>
                        <FormField label="Temperatura (°C)"       htmlFor="c-temp"><input id="c-temp" value={form.temperatureC} onChange={set('temperatureC')} /></FormField>
                        <FormField label="Freq. cardíaca (bpm)"   htmlFor="c-heart"><input id="c-heart" value={form.heartRate} onChange={set('heartRate')} /></FormField>
                    </div>

                    <FormField label="Anamnese / Histórico" htmlFor="anamnesis">
                        <textarea id="anamnesis" rows={3} value={form.anamnesis} onChange={set('anamnesis')} />
                    </FormField>

                    <FormField label="Procedimentos realizados" htmlFor="procedures">
                        <textarea id="procedures" rows={3} value={form.procedures} onChange={set('procedures')} />
                    </FormField>

                    <FormField label="Diagnóstico" htmlFor="diagnosis">
                        <textarea id="diagnosis" rows={3} value={form.diagnosis} onChange={set('diagnosis')} />
                    </FormField>

                    <FormField label="Plano terapêutico / Tratamento" htmlFor="treatment">
                        <textarea id="treatment" rows={3} value={form.treatment} onChange={set('treatment')} />
                    </FormField>

                    <FormField label="Observações adicionais" htmlFor="notes">
                        <textarea id="notes" rows={2} value={form.notes} onChange={set('notes')} />
                    </FormField>

                    <div className="clinical-form-actions">
                        <Button variant="outline" type="button" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                        <Button type="submit" icon={Save} loading={saving}>Salvar alterações</Button>
                    </div>
                </form>
            ) : (
                <article className="pd-consultation" style={{ marginTop: '0.5rem' }}>
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
                            {!c.anamnesis && !c.procedures && !c.diagnosis && !c.treatment && !c.notes && (
                                <Alert tone="warning">
                                    Este prontuário foi salvo com dados mínimos. Use "Editar" para completar a anamnese.
                                </Alert>
                            )}
                        </div>
                    </div>
                </article>
            )}
        </>
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
