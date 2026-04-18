import { useMemo, useState } from 'react'
import { Check, Syringe, Save } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import { savePet } from '../../services/pets.service'
import { vaccinesBySpecies, addMonths } from '../../shared/constants/vaccines'
import { useToast } from '../../shared/components/ui/Toast'
import { useAuth } from '../auth/AuthContext'

export default function VaccineRegistrationModal({ open, onClose, pet, onSaved }) {
    const { currentUser } = useAuth()
    const toast = useToast()
    const catalog = useMemo(() => pet ? vaccinesBySpecies(pet.species) : [], [pet])
    const [selected, setSelected] = useState([])
    const [appliedAt, setAppliedAt] = useState(new Date().toISOString().slice(0,10))
    const [saving, setSaving] = useState(false)

    if (!pet) return null

    const toggle = (id) => setSelected(list => list.includes(id) ? list.filter(i => i !== id) : [...list, id])

    const submit = async () => {
        if (!selected.length) return toast.error('Selecione ao menos uma vacina.')
        setSaving(true)
        try {
            const newEntries = selected.map(id => {
                const meta = catalog.find(v => v.id === id)
                return {
                    name:    meta.name,
                    date:    appliedAt,
                    nextDue: addMonths(appliedAt, meta.boosterMonths),
                    vet:     currentUser.name,
                    status:  'applied',
                }
            })
            const vaccines = [...(pet.vaccines ?? []), ...newEntries]
            await savePet({ ...pet, vaccines })
            setSelected([])
            onSaved?.()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Registrar vacina — ${pet.name}`}
            description="Selecione as vacinas aplicadas. O sistema calcula automaticamente a próxima dose conforme o protocolo."
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} loading={saving} icon={Save}>Registrar</Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Data da aplicação" icon={Syringe}>
                    <input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
                </FormField>

                <div className="booking-vaccine-list">
                    {catalog.map(v => {
                        const sel = selected.includes(v.id)
                        return (
                            <button
                                key={v.id}
                                type="button"
                                className={`booking-vaccine-item ${sel ? 'selected' : ''}`}
                                onClick={() => toggle(v.id)}
                            >
                                <div className="booking-vaccine-check">{sel ? <Check size={14} /> : null}</div>
                                <div>
                                    <strong>{v.name}</strong>
                                    <span>Reforço em {v.boosterMonths} meses</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </Modal>
    )
}
