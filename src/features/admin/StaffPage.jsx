import { useMemo, useState } from 'react'
import { ShieldCheck, Plus, Trash2, Mail, Phone, BadgeCheck } from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import {
    listStaff,
    deleteProfile,
    updateProfile,
} from '../../services/profiles.service'
import { adminCreateUser } from '../../services/auth.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import Avatar from '../../shared/components/ui/Avatar'
import Modal from '../../shared/components/ui/Modal'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import Badge from '../../shared/components/ui/Badge'
import { useToast } from '../../shared/components/ui/Toast'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import EmptyState from '../../shared/components/ui/EmptyState'
import { maskDocument, maskPhone, onlyDigits, formatDocument } from '../../shared/utils/masks'
import { isValidDocument, isValidEmail, isValidPhone } from '../../shared/utils/validation'

export default function StaffPage() {
    const toast = useToast()
    const staff = useAsync(() => listStaff(), [])
    const [createOpen, setCreateOpen] = useState(false)
    const [toDelete,   setToDelete]   = useState(null)
    const [deleting,   setDeleting]   = useState(false)

    const confirmDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await deleteProfile(toDelete.id)
            toast.success('Colaborador removido.')
            setToDelete(null)
            staff.refetch()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeleting(false)
        }
    }

    const toggleRole = async (person, role) => {
        try {
            await updateProfile(person.id, { role })
            toast.success(`Papel atualizado para ${role === 'admin' ? 'Administrador' : 'Veterinário'}.`)
            staff.refetch()
        } catch (e) {
            toast.error(e.message)
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Gestão interna"
                title="Equipe da clínica"
                subtitle="Cadastre veterinários e administradores. Gerencie acesso e permissões do sistema."
                actions={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Novo colaborador</Button>}
            />

            {staff.loading && <SkeletonRows rows={3} height={70} />}
            {!staff.loading && (staff.data ?? []).length === 0 && (
                <EmptyState icon={ShieldCheck} title="Nenhum colaborador cadastrado" description="Adicione veterinários e administradores da clínica." />
            )}

            <div className="stack gap-2">
                {(staff.data ?? []).map(p => (
                    <div key={p.id} className="client-row">
                        <Avatar name={p.name} />
                        <div>
                            <strong>{p.name}</strong>
                            <span><Mail size={12} style={{ verticalAlign: 'middle' }} /> {p.email}</span>
                        </div>
                        <div>
                            {p.phone && <span><Phone size={12} style={{ verticalAlign: 'middle' }} /> {p.phone}</span>}
                            {p.crmv && <span><BadgeCheck size={12} style={{ verticalAlign: 'middle' }} /> CRMV {p.crmv}</span>}
                            {p.document && <span>{formatDocument(p.document)}</span>}
                        </div>
                        <div>
                            <Badge tone={p.role === 'admin' ? 'brand' : 'info'}>
                                {p.role === 'admin' ? 'Administrador(a)' : 'Veterinário(a)'}
                            </Badge>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button variant="outline" size="sm" onClick={() => toggleRole(p, p.role === 'admin' ? 'vet' : 'admin')}>
                                Tornar {p.role === 'admin' ? 'vet' : 'admin'}
                            </Button>
                            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setToDelete(p)} />
                        </div>
                    </div>
                ))}
            </div>

            <CreateStaffModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={() => { setCreateOpen(false); staff.refetch(); toast.success('Colaborador adicionado.') }}
            />

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Remover colaborador?"
                description={toDelete ? `${toDelete.name} perderá acesso ao sistema. Dados clínicos vinculados serão mantidos.` : ''}
                loading={deleting}
            />
        </>
    )
}

function CreateStaffModal({ open, onClose, onCreated }) {
    const toast = useToast()
    const [form, setForm] = useState({
        name: '', document: '', email: '', phone: '', password: '', role: 'vet',
    })
    const [saving, setSaving] = useState(false)

    const set = (k) => (e) => {
        const v = e.target.value
        setForm(prev => ({
            ...prev,
            [k]: k === 'document' ? maskDocument(v) : k === 'phone' ? maskPhone(v) : v,
        }))
    }

    const submit = async (e) => {
        e.preventDefault()
        if (form.name.trim().length < 3)        return toast.error('Informe o nome completo.')
        if (!isValidDocument(form.document))    return toast.error('Documento inválido.')
        if (!isValidEmail(form.email))          return toast.error('E-mail inválido.')
        if (!isValidPhone(form.phone))          return toast.error('Telefone inválido.')
        if (form.password.length < 6)           return toast.error('Senha precisa ter ao menos 6 caracteres.')

        setSaving(true)
        try {
            const res = await adminCreateUser({
                name:     form.name.trim(),
                document: onlyDigits(form.document),
                email:    form.email.trim().toLowerCase(),
                phone:    form.phone,
                password: form.password,
                role:     form.role,
            })
            if (!res.ok) return toast.error(res.message)
            onCreated?.()
            setForm({ name: '', document: '', email: '', phone: '', password: '', role: 'vet' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Novo colaborador"
            description="Crie a conta de acesso para um(a) veterinário(a) ou administrador(a)."
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} loading={saving} icon={Plus}>Criar conta</Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="Nome completo" htmlFor="staff-name"><input id="staff-name" value={form.name} onChange={set('name')} required /></FormField>
                    <FormField label="Papel" htmlFor="staff-role">
                        <SelectInput
                            id="staff-role"
                            value={form.role}
                            onChange={set('role')}
                            options={[
                                { value: 'vet',   label: 'Veterinário(a)'   },
                                { value: 'admin', label: 'Administrador(a)' },
                            ]}
                        />
                    </FormField>
                    <FormField label="CPF ou CNPJ" htmlFor="staff-doc"><input id="staff-doc" value={form.document} onChange={set('document')} required /></FormField>
                    <FormField label="Telefone" htmlFor="staff-phone"><input id="staff-phone" value={form.phone} onChange={set('phone')} required /></FormField>
                </div>
                <FormField label="E-mail" htmlFor="staff-email"><input id="staff-email" type="email" value={form.email} onChange={set('email')} required /></FormField>
                <FormField label="Senha provisória" htmlFor="staff-pass" hint="O colaborador poderá trocar depois do primeiro login.">
                    <input id="staff-pass" type="password" minLength={6} value={form.password} onChange={set('password')} required />
                </FormField>
            </form>
        </Modal>
    )
}
