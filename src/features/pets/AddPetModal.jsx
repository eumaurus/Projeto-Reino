import { useState } from 'react'
import { PawPrint, Hash, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import { getPetById, savePet } from '../../services/pets.service'
import { useToast } from '../../shared/components/ui/Toast'

export default function AddPetModal({ open, onClose, ownerId, onCreated }) {
    const toast = useToast()
    const [code,    setCode]    = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        const clean = code.trim()
        if (!/^\d{4,6}$/.test(clean)) {
            toast.error('Informe um código de pet válido (4 a 6 dígitos).')
            return
        }
        setLoading(true)
        try {
            const pet = await getPetById(clean)
            if (!pet) {
                toast.error('Nenhum pet encontrado com esse código. Peça à recepção para cadastrar seu pet primeiro.')
                return
            }
            if (pet.ownerId && pet.ownerId !== ownerId) {
                toast.error('Este pet já pertence a outro tutor. Fale com a recepção se houver engano.')
                return
            }
            await savePet({ ...pet, ownerId })
            toast.success(`${pet.name} vinculado com sucesso.`)
            onCreated?.()
            onClose?.()
            setCode('')
        } catch (err) {
            toast.error(err.message ?? 'Não foi possível vincular o pet.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Vincular pet à sua conta"
            description="Peça à recepção do Reino Animal o código do seu pet. Cada pet tem um código único que liga o prontuário ao seu cadastro."
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                    <Button onClick={submit} loading={loading} icon={CheckCircle2}>Vincular</Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Código do pet" icon={Hash}>
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g,''))}
                        placeholder="Ex.: 12345"
                        maxLength={6}
                        autoFocus
                    />
                </FormField>
                <div style={{
                    display: 'flex', gap: 10, padding: '0.85rem',
                    background: 'var(--brand-primary-soft)',
                    borderRadius: 'var(--r-md)',
                    color: 'var(--brand-secondary)',
                    fontSize: 13,
                    lineHeight: 1.5,
                }}>
                    <PawPrint size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                        <strong>Não tem o código?</strong> Ligue para a clínica em <strong>{'(11) 4198-4301'}</strong> ou mande mensagem no WhatsApp — pedimos desculpas pelo tempo de resposta.
                    </span>
                </div>
            </form>
        </Modal>
    )
}
