import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User, Phone, FileBadge, AlertCircle, CheckCircle2 } from 'lucide-react'
import AuthLayout from './AuthLayout'
import FormField from '../../shared/components/ui/FormField'
import Button from '../../shared/components/ui/Button'
import { signUpClient } from '../../services/auth.service'
import { maskDocument, maskPhone, onlyDigits } from '../../shared/utils/masks'
import { isValidDocument, isValidEmail, isValidPhone } from '../../shared/utils/validation'

export default function RegisterPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({
        name: '', document: '', email: '', phone: '', password: '', confirm: '',
    })
    const [error,   setError]   = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const onField = (field) => (e) => {
        const v = e.target.value
        setForm(prev => ({
            ...prev,
            [field]: field === 'document' ? maskDocument(v) : field === 'phone' ? maskPhone(v) : v,
        }))
    }

    const submit = async (e) => {
        e.preventDefault()
        setError('')

        if (form.name.trim().length < 3) return setError('Informe seu nome completo.')
        if (!isValidDocument(form.document)) return setError('CPF ou CNPJ inválido.')
        if (!isValidEmail(form.email)) return setError('E-mail inválido.')
        if (!isValidPhone(form.phone)) return setError('Telefone inválido.')
        if (form.password.length < 6) return setError('A senha precisa ter ao menos 6 caracteres.')
        if (form.password !== form.confirm) return setError('As senhas não conferem.')

        setLoading(true)
        try {
            const res = await signUpClient({
                name:     form.name.trim(),
                document: onlyDigits(form.document),
                email:    form.email.trim().toLowerCase(),
                phone:    form.phone,
                password: form.password,
            })
            if (!res.ok) return setError(res.message)

            setSuccess(true)
            setTimeout(() => navigate('/login'), 2500)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <AuthLayout>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div style={{
                        width: 72, height: 72,
                        borderRadius: '50%',
                        background: 'var(--c-success-soft)',
                        color: 'var(--c-success)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                    }}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h1>Conta criada!</h1>
                    <p className="auth-subtitle" style={{ marginTop: 8 }}>
                        Enviamos você para a tela de login…
                    </p>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout>
            <h1>Criar conta</h1>
            <p className="auth-subtitle">Rápido e gratuito. Comece a cuidar do seu pet pelo portal.</p>

            <form className="auth-form" onSubmit={submit} style={{ marginTop: '1.5rem' }}>
                {error && (
                    <div style={{
                        display: 'flex', gap: 10, alignItems: 'center',
                        background: 'var(--c-danger-soft)', color: '#b91c1c',
                        padding: '0.7rem 0.9rem', borderRadius: 'var(--r-md)',
                        fontSize: 'var(--fs-sm)',
                    }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <FormField label="Nome completo" icon={User} htmlFor="name" required>
                    <input id="name" value={form.name} onChange={onField('name')} placeholder="João da Silva" required autoFocus />
                </FormField>

                <FormField label="CPF ou CNPJ" icon={FileBadge} htmlFor="document" required>
                    <input id="document" value={form.document} onChange={onField('document')} placeholder="000.000.000-00" required />
                </FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <FormField label="E-mail" icon={Mail} htmlFor="email" required>
                        <input id="email" type="email" value={form.email} onChange={onField('email')} placeholder="voce@email.com" required />
                    </FormField>

                    <FormField label="Telefone" icon={Phone} htmlFor="phone" required>
                        <input id="phone" value={form.phone} onChange={onField('phone')} placeholder="(11) 99999-9999" required />
                    </FormField>
                </div>

                <FormField label="Senha" icon={Lock} htmlFor="password" required hint="Mínimo 6 caracteres.">
                    <input id="password" type="password" value={form.password} onChange={onField('password')} required minLength={6} autoComplete="new-password" />
                </FormField>

                <FormField label="Confirmar senha" icon={Lock} htmlFor="confirm" required>
                    <input id="confirm" type="password" value={form.confirm} onChange={onField('confirm')} required minLength={6} autoComplete="new-password" />
                </FormField>

                <Button type="submit" size="lg" block loading={loading}>
                    Criar conta gratuita
                </Button>
            </form>

            <p className="auth-footer">
                Já tem conta? <Link to="/login">Entrar</Link>
            </p>
        </AuthLayout>
    )
}
