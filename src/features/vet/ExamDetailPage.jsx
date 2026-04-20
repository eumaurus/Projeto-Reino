import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, Edit3, Save, X, BadgeCheck, Microscope, Check,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { getExamById, updateExam } from '../../services/exams.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import Alert from '../../shared/components/ui/Alert'
import { StatusBadge } from '../../shared/components/ui/Badge'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { useToast } from '../../shared/components/ui/Toast'
import { formatDate } from '../../shared/utils/dates'
import { EXAM_STATUS, EXAM_CATEGORIES } from '../../shared/constants/statuses'
import './vet.css'
import './patient-detail.css'

export default function ExamDetailPage() {
    const { petId, examId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const petQuery  = useAsync(() => getPetById(petId), [petId])
    const examQuery = useAsync(() => getExamById(examId), [examId])

    const [editing, setEditing] = useState(false)
    const [saving, setSaving]   = useState(false)
    const [form, setForm] = useState({ type: '', category: 'laboratorial', status: 'requested', results: '', conclusion: '' })

    useEffect(() => {
        if (examQuery.data) {
            setForm({
                type:       examQuery.data.type       ?? '',
                category:   examQuery.data.category   ?? 'laboratorial',
                status:     examQuery.data.status     ?? 'requested',
                results:    examQuery.data.results    ?? '',
                conclusion: examQuery.data.conclusion ?? '',
            })
        }
    }, [examQuery.data])

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const cancelEdit = () => {
        const ex = examQuery.data
        setForm({
            type:       ex.type       ?? '',
            category:   ex.category   ?? 'laboratorial',
            status:     ex.status     ?? 'requested',
            results:    ex.results    ?? '',
            conclusion: ex.conclusion ?? '',
        })
        setEditing(false)
    }

    const save = async (e) => {
        e.preventDefault()
        if (!form.type.trim()) return toast.error('Informe o tipo de exame.')
        setSaving(true)
        try {
            await updateExam(examId, {
                type: form.type.trim(),
                category: form.category,
                status: form.status,
                results: form.results.trim() || null,
                conclusion: form.conclusion.trim() || null,
            })
            toast.success('Exame atualizado.')
            setEditing(false)
            examQuery.refetch()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao atualizar.')
        } finally {
            setSaving(false)
        }
    }

    const quickStatus = async (newStatus) => {
        setSaving(true)
        try {
            await updateExam(examId, { status: newStatus })
            toast.success('Status atualizado.')
            examQuery.refetch()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao atualizar.')
        } finally {
            setSaving(false)
        }
    }

    if (petQuery.loading || examQuery.loading) return <SkeletonRows rows={6} height={40} />

    const pet = petQuery.data
    const ex  = examQuery.data

    if (!pet || !ex) return <Alert tone="danger">Exame não encontrado.</Alert>

    return (
        <>
            <Link to={`/vet/patients/${pet.id}`} className="breadcrumbs">
                <ArrowLeft size={14} /> {pet.name} · Exames
            </Link>

            <PageHeader
                eyebrow="Exame"
                title={ex.type}
                subtitle={`${pet.name} · ${ex.category} · solicitado em ${formatDate(ex.requestedAt)}`}
                actions={
                    editing ? (
                        <>
                            <Button variant="outline" icon={X} onClick={cancelEdit} disabled={saving}>Cancelar edição</Button>
                            <Button icon={Save} onClick={save} loading={saving}>Salvar</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/vet/patients/${pet.id}`)}>Voltar</Button>
                            {ex.status === 'requested'   && <Button variant="outline" onClick={() => quickStatus('in_progress')} loading={saving}>Iniciar</Button>}
                            {ex.status === 'in_progress' && <Button variant="success" icon={Check} onClick={() => quickStatus('completed')} loading={saving}>Concluir</Button>}
                            <Button icon={Edit3} onClick={() => setEditing(true)}>Editar</Button>
                        </>
                    )
                }
            />

            {editing ? (
                <form className="clinical-form" onSubmit={save} style={{ marginTop: '0.5rem' }}>
                    <FormField label="Tipo de exame" required icon={Microscope}>
                        <input value={form.type} onChange={set('type')} required />
                    </FormField>

                    <div className="clinical-form-row">
                        <FormField label="Categoria">
                            <SelectInput
                                value={form.category}
                                onChange={set('category')}
                                options={EXAM_CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
                            />
                        </FormField>
                        <FormField label="Status">
                            <SelectInput
                                value={form.status}
                                onChange={set('status')}
                                options={Object.entries(EXAM_STATUS).map(([v, meta]) => ({ value: v, label: meta.label }))}
                            />
                        </FormField>
                    </div>

                    <FormField label="Resultados" hint="Valores encontrados, descrição técnica, etc.">
                        <textarea rows={4} value={form.results} onChange={set('results')} />
                    </FormField>

                    <FormField label="Conclusão" hint="Interpretação clínica resumida.">
                        <textarea rows={3} value={form.conclusion} onChange={set('conclusion')} />
                    </FormField>

                    <div className="clinical-form-actions">
                        <Button variant="outline" type="button" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                        <Button type="submit" icon={Save} loading={saving}>Salvar alterações</Button>
                    </div>
                </form>
            ) : (
                <article className="pd-exam" style={{ marginTop: '0.5rem' }}>
                    <div className="pd-head">
                        <div>
                            <h3 className="pd-head-title">{ex.type}</h3>
                            <div className="pd-head-meta">
                                <span>{ex.category} · solicitado em <strong>{formatDate(ex.requestedAt)}</strong></span>
                                {ex.completedAt && <span>· concluído em <strong>{formatDate(ex.completedAt)}</strong></span>}
                                {ex.vet?.name && (
                                    <span className="pd-head-vet">
                                        <BadgeCheck size={12} /> Dr(a). {ex.vet.name}{ex.vet.crmv ? ` · CRMV ${ex.vet.crmv}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        <StatusBadge value={ex.status} map={EXAM_STATUS} />
                    </div>

                    {(ex.results || ex.conclusion) ? (
                        <div className="pd-sections">
                            {ex.results    && <div className="pd-section"><span className="pd-section-label">Resultados</span><p className="pd-section-text">{ex.results}</p></div>}
                            {ex.conclusion && <div className="pd-section"><span className="pd-section-label">Conclusão</span><p className="pd-section-text">{ex.conclusion}</p></div>}
                        </div>
                    ) : (
                        <Alert tone="info">Aguardando preenchimento de resultados. Clique em "Editar" para inserir.</Alert>
                    )}

                    {ex.fileUrl && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <a href={ex.fileUrl} target="_blank" rel="noreferrer" className="exam-file-link">
                                Ver arquivo anexado →
                            </a>
                        </div>
                    )}
                </article>
            )}
        </>
    )
}
