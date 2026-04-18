import { useEffect, useMemo, useState } from 'react'
import { PawPrint, Save, User, Hash } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import ImageUploader from '../../shared/components/ui/ImageUploader'
import { generatePetCode, savePet, getPetById } from '../../services/pets.service'
import { listClients } from '../../services/profiles.service'
import { uploadPetImage } from '../../services/storage.service'
import { useAsync } from '../../shared/hooks/useAsync'
import { useToast } from '../../shared/components/ui/Toast'

const SPECIES_OPTIONS = [
    { value: 'Cachorro', label: 'Cachorro' },
    { value: 'Gato',     label: 'Gato'     },
    { value: 'Ave',      label: 'Ave'      },
    { value: 'Roedor',   label: 'Roedor'   },
    { value: 'Outro',    label: 'Outro'    },
]

const INITIAL = {
    name: '', species: 'Cachorro', breed: '', age: '', weight: '',
    birthDate: '', image: '', notes: '',
}

export default function CreatePetModal({ open, onClose, onCreated }) {
    const toast    = useToast()
    const clients  = useAsync(() => listClients(), [], { immediate: false })
    const [ownerId, setOwnerId] = useState('')
    const [code,    setCode]    = useState('')
    const [form,    setForm]    = useState(INITIAL)
    const [saving,  setSaving]  = useState(false)

    useEffect(() => {
        if (open) {
            setForm(INITIAL)
            setOwnerId('')
            setCode(generatePetCode())
            clients.refetch()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const ownerOptions = useMemo(() => ([
        { value: '', label: '— selecione um tutor —' },
        ...(clients.data ?? []).map(c => ({ value: c.id, label: `${c.name} — ${c.email}` })),
    ]), [clients.data])

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        if (!ownerId)              return toast.error('Selecione o tutor deste pet.')
        if (!form.name.trim())     return toast.error('Informe o nome do pet.')
        if (!form.species.trim())  return toast.error('Informe a espécie.')
        if (!/^\d{4,6}$/.test(code)) return toast.error('Código do pet inválido (4-6 dígitos).')

        setSaving(true)
        try {
            const existing = await getPetById(code)
            if (existing) return toast.error('Já existe um pet com esse código. Gere outro.')

            await savePet({
                id:         code,
                ownerId,
                name:       form.name.trim(),
                species:    form.species,
                breed:      form.breed.trim()  || null,
                age:        form.age.trim()    || null,
                weight:     form.weight.trim() || null,
                birthDate:  form.birthDate     || null,
                image:      form.image.trim()  || null,
                notes:      form.notes.trim()  || null,
                vaccines:   [],
            })
            toast.success(`${form.name} cadastrado com código #${code}.`)
            onCreated?.({ petId: code, ownerId })
        } catch (err) {
            toast.error(err.message ?? 'Falha ao cadastrar pet.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Novo paciente"
            description="Cadastre um pet e vincule ao tutor. O código gerado é o que o tutor usa no portal para ver o prontuário."
            size="lg"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} icon={Save} loading={saving}>Cadastrar</Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Tutor" icon={User} htmlFor="new-owner" required hint="Tutor precisa ter conta criada no portal para aparecer aqui.">
                        <SelectInput id="new-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} options={ownerOptions} />
                    </FormField>
                </div>

                <FormField label="Código do pet" icon={Hash} htmlFor="new-code" hint="Gerado automaticamente. Você pode ajustar.">
                    <input id="new-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g,''))} maxLength={6} />
                </FormField>

                <FormField label="Nome" icon={PawPrint} htmlFor="new-name" required>
                    <input id="new-name" value={form.name} onChange={set('name')} placeholder="Ex.: Thor" required />
                </FormField>

                <FormField label="Espécie" htmlFor="new-species" required>
                    <SelectInput id="new-species" value={form.species} onChange={set('species')} options={SPECIES_OPTIONS} />
                </FormField>

                <FormField label="Raça" htmlFor="new-breed">
                    <input id="new-breed" value={form.breed} onChange={set('breed')} placeholder="Ex.: Labrador" />
                </FormField>

                <FormField label="Idade" htmlFor="new-age">
                    <input id="new-age" value={form.age} onChange={set('age')} placeholder="Ex.: 4 anos" />
                </FormField>

                <FormField label="Peso" htmlFor="new-weight">
                    <input id="new-weight" value={form.weight} onChange={set('weight')} placeholder="Ex.: 28 kg" />
                </FormField>

                <FormField label="Data de nascimento" htmlFor="new-birth">
                    <input id="new-birth" type="date" value={form.birthDate} onChange={set('birthDate')} />
                </FormField>

                <div style={{ gridColumn: '1 / -1' }}>
                    <ImageUploader
                        label="Foto do pet"
                        value={form.image}
                        onChange={(url) => setForm(prev => ({ ...prev, image: url ?? '' }))}
                        onUpload={(file) => uploadPetImage(file, code || 'new')}
                    />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Observações clínicas" htmlFor="new-notes">
                        <textarea id="new-notes" rows={3} value={form.notes} onChange={set('notes')} placeholder="Alergias, comportamento, histórico prévio..." />
                    </FormField>
                </div>
            </form>
        </Modal>
    )
}
