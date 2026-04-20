import { useEffect, useState } from 'react'
import { Save, Trash2, ShieldCheck } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../shared/components/ui/Toast'
import { savePet } from '../../services/pets.service'

export default function EditVaccineModal({ open, onClose, pet, vaccine, index, onSaved }) {
    const toast = useToast()
    const [form, setForm] = useState({ name: '', date: '', nextDue: '', vet: '' })
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        if (open && vaccine) {
            setForm({
                name:    vaccine.name    ?? '',
                date:    vaccine.date    ?? '',
                nextDue: vaccine.nextDue ?? '',
                vet:     vaccine.vet     ?? '',
            })
        }
    }, [open, vaccine])

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const save = async () => {
        if (!form.name.trim()) return toast.error('Informe o nome da vacina.')
        if (!form.date) return toast.error('Informe a data de aplicação.')
        setSaving(true)
        try {
            const updated = [...(pet.vaccines ?? [])]
            updated[index] = {
                ...updated[index],
                name: form.name.trim(),
                date: form.date,
                nextDue: form.nextDue || null,
                vet: form.vet.trim() || null,
            }
            await savePet({ ...pet, vaccines: updated })
            toast.success('Vacina atualizada.')
            onSaved?.()
            onClose?.()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao salvar.')
        } finally {
            setSaving(false)
        }
    }

    const remove = async () => {
        setSaving(true)
        try {
            const updated = (pet.vaccines ?? []).filter((_, i) => i !== index)
            await savePet({ ...pet, vaccines: updated })
            toast.success('Vacina removida.')
            setConfirmDelete(false)
            onSaved?.()
            onClose?.()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao remover.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <Modal
                open={open}
                onClose={saving ? undefined : onClose}
                size="sm"
                title="Editar vacina"
                description={pet ? `${pet.name} · Tutor: ${pet.owner?.name ?? '—'}` : ''}
                footer={
                    <>
                        <Button variant="ghost" icon={Trash2} onClick={() => setConfirmDelete(true)} disabled={saving}>
                            Remover
                        </Button>
                        <div style={{ flex: 1 }} />
                        <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                        <Button icon={Save} onClick={save} loading={saving}>Salvar</Button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <FormField label="Nome da vacina" icon={ShieldCheck} required>
                        <input value={form.name} onChange={set('name')} required />
                    </FormField>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <FormField label="Data de aplicação" required>
                            <input type="date" value={form.date} onChange={set('date')} required />
                        </FormField>
                        <FormField label="Próximo reforço">
                            <input type="date" value={form.nextDue} onChange={set('nextDue')} />
                        </FormField>
                    </div>
                    <FormField label="Veterinário responsável">
                        <input value={form.vet} onChange={set('vet')} placeholder="Nome do(a) profissional" />
                    </FormField>
                </div>
            </Modal>

            <ConfirmDialog
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={remove}
                title="Remover vacina?"
                description={vaccine ? `"${vaccine.name}" será removida do histórico do pet. Essa ação não pode ser desfeita.` : ''}
                loading={saving}
            />
        </>
    )
}
