import { useEffect, useState } from 'react'
import { User, Mail, Phone, Lock, Save, ShieldCheck, BadgeCheck, FileBadge, Camera } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { updateOwnProfile, changePassword } from '../../services/auth.service'
import { uploadAvatar } from '../../services/storage.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import Card from '../../shared/components/ui/Card'
import Avatar from '../../shared/components/ui/Avatar'
import { maskPhone, formatDocument } from '../../shared/utils/masks'
import { ROLE_LABEL } from '../../shared/constants/roles'
import { useToast } from '../../shared/components/ui/Toast'
import './profile.css'

export default function ProfilePage() {
    const { currentUser, refreshProfile } = useAuth()
    const toast = useToast()

    const [name,    setName]   = useState('')
    const [email,   setEmail]  = useState('')
    const [phone,   setPhone]  = useState('')
    const [saving,  setSaving] = useState(false)

    const [currentPass, setCurrentPass] = useState('')
    const [newPass,     setNewPass]     = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [savingPass,  setSavingPass]  = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const onAvatarPicked = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 2 * 1024 * 1024) return toast.error('Máximo 2 MB para avatar.')
        setUploadingAvatar(true)
        try {
            const url = await uploadAvatar(file, currentUser.id)
            const res = await updateOwnProfile(currentUser.id, { avatar_url: url })
            if (!res.ok) throw new Error(res.message)
            toast.success('Foto de perfil atualizada.')
            await refreshProfile(currentUser)
        } catch (err) {
            toast.error(err.message ?? 'Falha no upload.')
        } finally {
            setUploadingAvatar(false)
            e.target.value = ''
        }
    }

    useEffect(() => {
        if (!currentUser) return
        setName(currentUser.name ?? '')
        setEmail(currentUser.email ?? '')
        setPhone(maskPhone(currentUser.phone ?? ''))
    }, [currentUser])

    const saveProfile = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await updateOwnProfile(currentUser.id, {
                name:  name.trim(),
                phone: phone.trim(),
            })
            if (!res.ok) {
                toast.error(res.message ?? 'Falha ao salvar.')
            } else {
                toast.success('Dados atualizados.')
                await refreshProfile(currentUser)
            }
        } finally {
            setSaving(false)
        }
    }

    const savePassword = async (e) => {
        e.preventDefault()
        if (newPass.length < 6) return toast.error('Nova senha precisa ter ao menos 6 caracteres.')
        if (newPass !== confirmPass) return toast.error('As senhas não conferem.')

        setSavingPass(true)
        try {
            const res = await changePassword(newPass)
            if (!res.ok) toast.error(res.message ?? 'Falha ao trocar senha.')
            else {
                toast.success('Senha atualizada.')
                setCurrentPass(''); setNewPass(''); setConfirmPass('')
            }
        } finally {
            setSavingPass(false)
        }
    }

    if (!currentUser) return null

    return (
        <>
            <PageHeader
                eyebrow="Configurações"
                title="Meus dados"
                subtitle="Atualize suas informações pessoais e mantenha sua conta segura."
            />

            <div className="profile-hero">
                <div className="profile-avatar-wrap">
                    <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="xl" />
                    <label className="profile-avatar-edit" title="Trocar foto">
                        <Camera size={14} />
                        <input type="file" accept="image/*" onChange={onAvatarPicked} style={{ display: 'none' }} disabled={uploadingAvatar} />
                    </label>
                    {uploadingAvatar && <div className="profile-avatar-spinner"><span className="btn-spinner" /></div>}
                </div>
                <div>
                    <h2>{currentUser.name}</h2>
                    <p>{ROLE_LABEL[currentUser.role]} · Membro desde {new Date(currentUser.createdAt ?? Date.now()).getFullYear()}</p>
                    <div className="profile-hero-chips">
                        <span><Mail size={13} /> {currentUser.email}</span>
                        {currentUser.document && <span><FileBadge size={13} /> {formatDocument(currentUser.document)}</span>}
                        {currentUser.crmv && <span><BadgeCheck size={13} /> CRMV {currentUser.crmv}</span>}
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                <Card>
                    <form onSubmit={saveProfile} className="profile-form">
                        <h3><User size={16} /> Informações pessoais</h3>
                        <p className="profile-form-hint">
                            Documento e e-mail são usados para login; se precisar alterá-los, fale com a recepção.
                        </p>

                        <FormField label="Nome completo" icon={User} htmlFor="p-name">
                            <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
                        </FormField>

                        <FormField label="E-mail" icon={Mail} htmlFor="p-email" hint="Contate a recepção para alterar o e-mail.">
                            <input id="p-email" value={email} disabled />
                        </FormField>

                        <FormField label="Telefone" icon={Phone} htmlFor="p-phone">
                            <input
                                id="p-phone"
                                value={phone}
                                onChange={(e) => setPhone(maskPhone(e.target.value))}
                                placeholder="(11) 99999-9999"
                            />
                        </FormField>

                        <Button type="submit" icon={Save} loading={saving}>
                            Salvar alterações
                        </Button>
                    </form>
                </Card>

                <Card id="password">
                    <form onSubmit={savePassword} className="profile-form">
                        <h3><ShieldCheck size={16} /> Segurança e senha</h3>
                        <p className="profile-form-hint">
                            Escolha uma senha com pelo menos 6 caracteres. Recomendamos mistura de letras, números e símbolos.
                        </p>

                        <FormField label="Senha atual" icon={Lock} htmlFor="p-current">
                            <input
                                id="p-current"
                                type="password"
                                value={currentPass}
                                onChange={(e) => setCurrentPass(e.target.value)}
                                autoComplete="current-password"
                            />
                        </FormField>

                        <FormField label="Nova senha" icon={Lock} htmlFor="p-new" required>
                            <input
                                id="p-new"
                                type="password"
                                minLength={6}
                                value={newPass}
                                onChange={(e) => setNewPass(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </FormField>

                        <FormField label="Confirmar nova senha" icon={Lock} htmlFor="p-confirm" required>
                            <input
                                id="p-confirm"
                                type="password"
                                minLength={6}
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </FormField>

                        <Button type="submit" icon={Save} loading={savingPass}>
                            Atualizar senha
                        </Button>
                    </form>
                </Card>
            </div>
        </>
    )
}
