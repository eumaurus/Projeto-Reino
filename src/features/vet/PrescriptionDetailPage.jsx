import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft, Edit3, Save, X, BadgeCheck, Printer, Plus, Trash2,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { getPrescriptionById, updatePrescription } from '../../services/prescriptions.service'
import { downloadPrescriptionPdf } from '../../shared/utils/pdf/prescriptionPdf'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import Alert from '../../shared/components/ui/Alert'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import { useToast } from '../../shared/components/ui/Toast'
import { formatDate, formatDateLong } from '../../shared/utils/dates'
import './vet.css'
import './patient-detail.css'

const EMPTY_ITEM = () => ({ name: '', dosage: '', frequency: '', duration: '', notes: '' })

export default function PrescriptionDetailPage() {
    const { petId, prescriptionId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    const petQuery = useAsync(() => getPetById(petId), [petId])
    const rxQuery  = useAsync(() => getPrescriptionById(prescriptionId), [prescriptionId])

    const [editing, setEditing] = useState(false)
    const [saving, setSaving]   = useState(false)
    const [items, setItems]           = useState([])
    const [instructions, setInstr]    = useState('')
    const [validUntil, setValidUntil] = useState('')

    useEffect(() => {
        if (rxQuery.data) {
            setItems(rxQuery.data.items?.length ? rxQuery.data.items : [EMPTY_ITEM()])
            setInstr(rxQuery.data.instructions ?? '')
            setValidUntil(rxQuery.data.validUntil ?? '')
        }
    }, [rxQuery.data])

    const updateItem = (idx, patch) =>
        setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
    const addItem    = () => setItems(prev => [...prev, EMPTY_ITEM()])
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

    const cancelEdit = () => {
        const d = rxQuery.data
        setItems(d.items?.length ? d.items : [EMPTY_ITEM()])
        setInstr(d.instructions ?? '')
        setValidUntil(d.validUntil ?? '')
        setEditing(false)
    }

    const save = async (e) => {
        e.preventDefault()
        const clean = items.filter(it => (it.name ?? '').trim() !== '')
        if (clean.length === 0) return toast.error('Adicione pelo menos um medicamento.')
        setSaving(true)
        try {
            await updatePrescription(prescriptionId, {
                items: clean,
                instructions: instructions.trim() || null,
                validUntil: validUntil || null,
            })
            toast.success('Receita atualizada.')
            setEditing(false)
            rxQuery.refetch()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao atualizar.')
        } finally {
            setSaving(false)
        }
    }

    if (petQuery.loading || rxQuery.loading) return <SkeletonRows rows={6} height={40} />

    const pet = petQuery.data
    const p   = rxQuery.data

    if (!pet || !p) return <Alert tone="danger">Receita não encontrada.</Alert>

    return (
        <>
            <Link to={`/vet/patients/${pet.id}`} className="breadcrumbs">
                <ArrowLeft size={14} /> {pet.name} · Receitas
            </Link>

            <PageHeader
                eyebrow="Receita"
                title={`Receita de ${formatDateLong(p.issuedAt)}`}
                subtitle={`${pet.name} · Tutor: ${pet.owner?.name ?? '—'}`}
                actions={
                    editing ? (
                        <>
                            <Button variant="outline" icon={X} onClick={cancelEdit} disabled={saving}>Cancelar edição</Button>
                            <Button icon={Save} onClick={save} loading={saving}>Salvar</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => navigate(`/vet/patients/${pet.id}`)}>Voltar</Button>
                            <Button variant="outline" icon={Printer} onClick={() => downloadPrescriptionPdf({ prescription: p, pet, owner: pet.owner })}>Imprimir</Button>
                            <Button icon={Edit3} onClick={() => setEditing(true)}>Editar</Button>
                        </>
                    )
                }
            />

            {editing ? (
                <form className="clinical-form" onSubmit={save} style={{ marginTop: '0.5rem' }}>
                    <FormField label="Validade da receita (opcional)" hint="Deixe em branco para sem validade">
                        <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                    </FormField>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <strong style={{ color: 'var(--brand-secondary)' }}>Medicamentos</strong>
                            <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addItem}>Adicionar</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {items.map((it, idx) => (
                                <div key={idx} className="rx-item">
                                    {items.length > 1 && (
                                        <button type="button" className="rx-item-remove" onClick={() => removeItem(idx)} aria-label="Remover">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                    <FormField label="Medicamento" required>
                                        <input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} required />
                                    </FormField>
                                    <div className="rx-grid">
                                        <FormField label="Dose"      ><input value={it.dosage}    onChange={(e) => updateItem(idx, { dosage: e.target.value })} placeholder="Ex.: 1 comp" /></FormField>
                                        <FormField label="Frequência"><input value={it.frequency} onChange={(e) => updateItem(idx, { frequency: e.target.value })} placeholder="Ex.: 8/8h" /></FormField>
                                        <FormField label="Duração"   ><input value={it.duration}  onChange={(e) => updateItem(idx, { duration: e.target.value })} placeholder="Ex.: 7 dias" /></FormField>
                                    </div>
                                    <FormField label="Observações"><textarea rows={2} value={it.notes} onChange={(e) => updateItem(idx, { notes: e.target.value })} /></FormField>
                                </div>
                            ))}
                        </div>
                    </div>

                    <FormField label="Instruções gerais (opcional)">
                        <textarea rows={3} value={instructions} onChange={(e) => setInstr(e.target.value)} />
                    </FormField>

                    <div className="clinical-form-actions">
                        <Button variant="outline" type="button" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
                        <Button type="submit" icon={Save} loading={saving}>Salvar alterações</Button>
                    </div>
                </form>
            ) : (
                <article className="pd-prescription" style={{ marginTop: '0.5rem' }}>
                    <div className="pd-head" style={{ alignItems: 'center' }}>
                        <div>
                            <h3 className="pd-head-title">Receita de {formatDateLong(p.issuedAt)}</h3>
                            {p.vet?.name && (
                                <div className="pd-head-meta">
                                    <span className="pd-head-vet">
                                        <BadgeCheck size={12} /> Dr(a). {p.vet.name}{p.vet.crmv ? ` · CRMV ${p.vet.crmv}` : ''}
                                    </span>
                                    {p.validUntil && <span>· Válida até <strong>{formatDate(p.validUntil)}</strong></span>}
                                </div>
                            )}
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
                            <div className="pd-section">
                                <span className="pd-section-label">Instruções gerais</span>
                                <p className="pd-section-text">{p.instructions}</p>
                            </div>
                        </div>
                    )}
                </article>
            )}
        </>
    )
}
