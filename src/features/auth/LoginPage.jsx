import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import AuthLayout from './AuthLayout'
import { useAuth } from './AuthContext'
import FormField from '../../shared/components/ui/FormField'
import Button from '../../shared/components/ui/Button'
import { maskDocument } from '../../shared/utils/masks'
import { homeForRole } from '../../shared/constants/roles'
import { supabase } from '../../services/supabase'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const [identifier, setIdentifier] = useState('')
    const [password,   setPassword]   = useState('')
    const [error,      setError]      = useState('')
    const [loading,    setLoading]    = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await login(identifier, password)
            if (!res.success) {
                setError(res.message)
                return
            }
            const { data } = await supabase.auth.getSession()
            const role = data?.session?.user?.user_metadata?.role ?? 'client'
            const from = location.state?.from
            navigate(from && from !== '/login' ? from : homeForRole(role), { replace: true })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <h1>Acesse sua conta</h1>
            <p className="auth-subtitle">Entre com seu e-mail ou CPF e senha para continuar.</p>

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

                <FormField label="E-mail ou CPF/CNPJ" icon={Mail} htmlFor="identifier">
                    <input
                        id="identifier"
                        value={identifier}
                        onChange={(e) => setIdentifier(maskDocument(e.target.value))}
                        placeholder="voce@email.com ou 000.000.000-00"
                        required
                        autoComplete="username"
                        autoFocus
                    />
                </FormField>

                <FormField label="Senha" icon={Lock} htmlFor="password">
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha"
                        required
                        autoComplete="current-password"
                    />
                </FormField>

                <Button type="submit" size="lg" block loading={loading}>
                    Entrar no portal
                </Button>
            </form>

            <p className="auth-footer">
                Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
            </p>
        </AuthLayout>
    )
}
