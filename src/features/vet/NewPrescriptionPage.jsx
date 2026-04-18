import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Trash2, Save } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { createPrescription } from '../../services/prescriptions.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Alert from '../../shared/components/ui/Alert'
import { useToast } from '../../shared/components/ui/Toast'

const EMPTY_ITEM = { name: '', dosage: '', frequency: '', duration: '', notes: '' }

export default function NewPrescriptionPage() {
    const { petId } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const toast = useToast()

    const petQuery = useAsync(() => getPetById(petId), [petId])
    const pet = petQuery.data

    const [items,        setItems]        = useState([{ ...EMPTY_ITEM }])
    const [instructions, setInstructions] = useState('')
    const [validUntil,   setValidUntil]   = useState('')
    const [saving,       setSaving]       = useState(false)

    const updateItem = (idx, field, value) =>
        setItems(list => list.map((it, i) => i === idx ? { ...it, [field]: value } : it))
    const addItem    = () => setItems(list => [...list, { ...EMPTY_ITEM }])
    const removeItem = (idx) => setItems(list => list.filter((_, i) => i !== idx))

    const submit = async (e) => {
        e.preventDefault()
        const clean = items
            .map(it => ({ ...it, name: it.name.trim() }))
            .filter(it => it.name)
        if (!clean.length) return toast.error('Adicione pelo menos um medicamento.')

        setSaving(true)
        try {
            await createPrescription({
                petId:        pet.id,
                ownerId:      pet.ownerId,
                vetId:        currentUser.id,
                items:        clean,
                instructions: instructions.trim() || null,
                validUntil:   validUntil || null,
            })
            toast.success('Receita emitida e notificada ao tutor.')
            navigate(`/vet/patients/${pet.id}`)
        } catch (err) {
            toast.error(err.message ?? 'Falha ao emitir receita.')
        } finally {
            setSaving(false)
        }
    }

    if (petQuery.loading) return <SkeletonRows rows={6} height={40} />
    if (!pet) return <Alert tone="danger">Paciente não encontrado.</Alert>

    return (
        <>
            <Link to={`/vet/patients/${pet.id}`} className="breadcrumbs">
                <ArrowLeft size={14} /> {pet.name}
            </Link>

            <PageHeader
                eyebrow="Receituário"
                title={`Nova receita — ${pet.name}`}
                subtitle={`Tutor: ${pet.owner?.name ?? '—'} · Emissão por Dr(a). ${currentUser.name}`}
            />

            <form className="clinical-form" onSubmit={submit}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--brand-secondary)', fontSize: 'var(--fs-md)', fontWeight: 600, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <FileText size={18} /> Medicamentos prescritos
                    </div>
                    <FormField label="Válida até">
                        <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                    </FormField>
                </div>

                <div className="stack gap-3">
                    {items.map((it, idx) => (
                        <div key={idx} className="rx-item">
                            {items.length > 1 && (
                                <button type="button" className="rx-item-remove" onClick={() => removeItem(idx)} aria-label="Remover">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <FormField label={`Medicamento ${idx + 1}`}>
                                <input value={it.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="Ex.: Amoxicilina 500mg" required />
                            </FormField>
                            <div className="rx-grid">
                                <FormField label="Dose">
                                    <input value={it.dosage} onChange={(e) => updateItem(idx, 'dosage', e.target.value)} placeholder="Ex.: 1 comprimido" />
                                </FormField>
                                <FormField label="Frequência">
                                    <input value={it.frequency} onChange={(e) => updateItem(idx, 'frequency', e.target.value)} placeholder="Ex.: 12/12h" />
                                </FormField>
                                <FormField label="Duração">
                                    <input value={it.duration} onChange={(e) => updateItem(idx, 'duration', e.target.value)} placeholder="Ex.: 7 dias" />
                                </FormField>
                            </div>
                            <FormField label="Observações do item">
                                <textarea rows={2} value={it.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)} />
                            </FormField>
                        </div>
                    ))}
                </div>

                <Button type="button" variant="outline" icon={Plus} onClick={addItem}>Adicionar outro medicamento</Button>

                <FormField label="Instruções gerais (opcional)">
                    <textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Administrar junto com alimentação, retorno em 7 dias, contraindicações..." />
                </FormField>

                <div className="clinical-form-actions">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancelar</Button>
                    <Button type="submit" icon={Save} loading={saving}>Emitir receita</Button>
                </div>
            </form>
        </>
    )
}
