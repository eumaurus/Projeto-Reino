import { useEffect, useState } from 'react'
import { Save, PawPrint } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import ImageUploader from '../../shared/components/ui/ImageUploader'
import { savePet } from '../../services/pets.service'
import { uploadPetImage } from '../../services/storage.service'
import { useToast } from '../../shared/components/ui/Toast'

const SPECIES_OPTIONS = [
    { value: 'Cachorro', label: 'Cachorro' },
    { value: 'Gato',     label: 'Gato' },
    { value: 'Ave',      label: 'Ave' },
    { value: 'Roedor',   label: 'Roedor' },
    { value: 'Outro',    label: 'Outro' },
]

export default function EditPetModal({ open, onClose, pet, onSaved }) {
    const toast = useToast()
    const [form, setForm] = useState(pet ?? null)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open && pet) setForm({ ...pet })
    }, [open, pet])

    if (!form) return null

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            await savePet(form)
            toast.success('Ficha atualizada.')
            onSaved?.()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao salvar.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Ficha técnica de ${form.name}`}
            description="Atualize dados clínicos e cadastrais do paciente."
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} icon={Save} loading={saving}>Salvar</Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="Nome"  icon={PawPrint} htmlFor="pet-name"><input id="pet-name" value={form.name ?? ''} onChange={set('name')} required /></FormField>
                <FormField label="Espécie" htmlFor="pet-species">
                    <SelectInput id="pet-species" value={form.species ?? ''} onChange={set('species')} options={SPECIES_OPTIONS} />
                </FormField>
                <FormField label="Raça" htmlFor="pet-breed"><input id="pet-breed" value={form.breed ?? ''} onChange={set('breed')} /></FormField>
                <FormField label="Idade" htmlFor="pet-age"><input id="pet-age" value={form.age ?? ''} onChange={set('age')} placeholder="Ex.: 3 anos" /></FormField>
                <FormField label="Peso"  htmlFor="pet-weight"><input id="pet-weight" value={form.weight ?? ''} onChange={set('weight')} placeholder="Ex.: 12 kg" /></FormField>
                <FormField label="Data de nascimento" htmlFor="pet-birth"><input id="pet-birth" type="date" value={form.birthDate ?? ''} onChange={set('birthDate')} /></FormField>
                <div style={{ gridColumn: '1 / -1' }}>
                    <ImageUploader
                        label="Foto do pet"
                        value={form.image}
                        onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
                        onUpload={(file) => uploadPetImage(file, form.id)}
                    />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Observações clínicas" htmlFor="pet-notes">
                        <textarea id="pet-notes" rows={3} value={form.notes ?? ''} onChange={set('notes')} />
                    </FormField>
                </div>
            </form>
        </Modal>
    )
}
