import { useEffect, useState } from 'react'
import { Save, Key, User, Mail, Phone, FileBadge, BadgeCheck, Lock, ShieldAlert } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import Alert from '../../shared/components/ui/Alert'
import { useToast } from '../../shared/components/ui/Toast'
import { updateProfile } from '../../services/profiles.service'
import { sendPasswordResetEmail, adminForcePasswordChange } from '../../services/auth.service'
import { maskPhone, formatDocument } from '../../shared/utils/masks'
import { isValidPhone } from '../../shared/utils/validation'

export default function EditStaffModal({ open, onClose, staff, onSaved }) {
    const toast = useToast()
    const [form, setForm] = useState({ name: '', phone: '', role: 'vet', crmv: '' })
    const [saving, setSaving] = useState(false)
    const [sendingReset, setSendingReset] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [forcingPassword, setForcingPassword] = useState(false)
    const [confirmForce, setConfirmForce] = useState(false)

    useEffect(() => {
        if (open && staff) {
            setForm({
                name:  staff.name  ?? '',
                phone: maskPhone(staff.phone ?? ''),
                role:  staff.role  ?? 'vet',
                crmv:  staff.crmv  ?? '',
            })
            setNewPassword('')
            setConfirmForce(false)
        }
    }, [open, staff])

    const set = (k) => (e) => {
        const v = e.target.value
        setForm(prev => ({ ...prev, [k]: k === 'phone' ? maskPhone(v) : v }))
    }

    const save = async () => {
        if (form.name.trim().length < 3) return toast.error('Informe o nome completo.')
        if (form.phone && !isValidPhone(form.phone)) return toast.error('Telefone inválido.')
        setSaving(true)
        try {
            const fields = {
                name:  form.name.trim(),
                phone: form.phone || null,
                role:  form.role,
            }
            // CRMV só faz sentido para vet/admin (profissionais). Para recepção, limpa.
            fields.crmv = form.role === 'reception' ? null : (form.crmv.trim() || null)

            await updateProfile(staff.id, fields)
            toast.success('Colaborador atualizado.')
            onSaved?.()
            onClose?.()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao salvar.')
        } finally {
            setSaving(false)
        }
    }

    const resetPassword = async () => {
        if (!staff?.email) return toast.error('Colaborador sem e-mail cadastrado.')
        setSendingReset(true)
        try {
            const res = await sendPasswordResetEmail(staff.email)
            if (res.ok) toast.success(`Link de redefinição enviado para ${staff.email}.`)
            else toast.error(res.message ?? 'Falha ao enviar link.')
        } finally {
            setSendingReset(false)
        }
    }

    const forcePassword = async () => {
        if (newPassword.length < 6) return toast.error('A nova senha precisa ter ao menos 6 caracteres.')
        if (!confirmForce) return setConfirmForce(true)
        setForcingPassword(true)
        try {
            const res = await adminForcePasswordChange({ userId: staff.id, newPassword })
            if (res.ok) {
                toast.success(`Senha de ${staff.name} atualizada. Informe ao(à) colaborador(a).`)
                setNewPassword('')
                setConfirmForce(false)
            } else {
                toast.error(res.message ?? 'Falha ao atualizar senha.')
            }
        } finally {
            setForcingPassword(false)
        }
    }

    if (!staff) return null

    const isReception = form.role === 'reception'

    return (
        <Modal
            open={open}
            onClose={saving || sendingReset ? undefined : onClose}
            size="md"
            title={`Editar ${staff.name}`}
            description={staff.email}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button icon={Save} onClick={save} loading={saving}>Salvar alterações</Button>
                </>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Alert tone="info">
                    CPF/CNPJ e e-mail não podem ser alterados. Para trocar a senha, envie um link de redefinição por e-mail.
                </Alert>

                <FormField label="Nome completo" icon={User} required>
                    <input value={form.name} onChange={set('name')} required />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="CPF/CNPJ" icon={FileBadge}>
                        <input value={staff.document ? formatDocument(staff.document) : '—'} disabled />
                    </FormField>
                    <FormField label="Telefone" icon={Phone}>
                        <input value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
                    </FormField>
                </div>

                <FormField label="E-mail" icon={Mail} hint="Contate o suporte para alterar o e-mail de login.">
                    <input value={staff.email ?? ''} disabled />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="Papel">
                        <SelectInput
                            value={form.role}
                            onChange={set('role')}
                            options={[
                                { value: 'vet',       label: 'Veterinário(a)'   },
                                { value: 'admin',     label: 'Administrador(a)' },
                                { value: 'reception', label: 'Recepção'         },
                            ]}
                        />
                    </FormField>
                    <FormField
                        label={isReception ? 'CRMV (não aplicável)' : 'CRMV'}
                        icon={BadgeCheck}
                        hint={isReception ? 'Recepção não tem CRMV.' : 'Ex.: 14.348'}
                    >
                        <input
                            value={isReception ? '' : form.crmv}
                            onChange={set('crmv')}
                            disabled={isReception}
                            placeholder={isReception ? '—' : '14.348'}
                        />
                    </FormField>
                </div>

                <div style={{
                    marginTop: 4,
                    padding: '0.85rem 1rem',
                    background: 'var(--c-gray-50)',
                    border: '1px solid var(--c-gray-200)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div>
                            <strong style={{ display: 'block', color: 'var(--brand-secondary)', fontSize: 14 }}>
                                Enviar link por e-mail
                            </strong>
                            <span style={{ fontSize: 12, color: 'var(--c-gray-500)' }}>
                                O(a) colaborador(a) cria a nova senha sozinho(a).
                            </span>
                        </div>
                        <Button variant="outline" icon={Key} onClick={resetPassword} loading={sendingReset} disabled={saving || forcingPassword}>
                            Enviar link
                        </Button>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--c-gray-300)', paddingTop: '0.65rem' }}>
                        <strong style={{ display: 'block', color: 'var(--brand-secondary)', fontSize: 14, marginBottom: 2 }}>
                            Forçar nova senha agora
                        </strong>
                        <span style={{ fontSize: 12, color: 'var(--c-gray-500)', display: 'block', marginBottom: 8 }}>
                            Defina uma senha temporária e repasse ao colaborador pessoalmente.
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <FormField label="">
                                <input
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setConfirmForce(false) }}
                                    placeholder="Nova senha (mín. 6)"
                                    autoComplete="new-password"
                                />
                            </FormField>
                            <Button
                                variant={confirmForce ? 'danger' : 'outline'}
                                icon={confirmForce ? ShieldAlert : Lock}
                                onClick={forcePassword}
                                loading={forcingPassword}
                                disabled={saving || sendingReset || newPassword.length < 6}
                            >
                                {confirmForce ? 'Confirmar' : 'Definir senha'}
                            </Button>
                        </div>
                        {confirmForce && (
                            <span style={{ fontSize: 12, color: 'var(--c-danger)', display: 'block', marginTop: 6 }}>
                                Clique novamente para confirmar. A senha atual do(a) colaborador(a) será substituída.
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
