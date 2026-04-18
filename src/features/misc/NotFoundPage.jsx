import { Link } from 'react-router-dom'
import { Home, PawPrint } from 'lucide-react'
import Button from '../../shared/components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import { homeForRole } from '../../shared/constants/roles'

export default function NotFoundPage() {
    const { currentUser } = useAuth()
    const homePath = currentUser ? homeForRole(currentUser.role) : '/'

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--c-gray-50)',
            padding: '2rem',
        }}>
            <div style={{
                maxWidth: 520,
                textAlign: 'center',
            }}>
                <div style={{
                    width: 96, height: 96,
                    borderRadius: '50%',
                    background: 'var(--brand-primary-soft)',
                    color: 'var(--brand-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                }}>
                    <PawPrint size={44} />
                </div>
                <h1 style={{ fontSize: '4rem', marginBottom: 0, color: 'var(--brand-secondary)' }}>404</h1>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Página não encontrada</h2>
                <p style={{ color: 'var(--c-gray-600)', marginBottom: '2rem', maxWidth: 400, margin: '0 auto 2rem' }}>
                    A página que você tentou acessar não existe ou foi movida. Vamos te levar de volta?
                </p>
                <Link to={homePath}>
                    <Button size="lg" icon={Home}>
                        {currentUser ? 'Voltar ao portal' : 'Voltar ao início'}
                    </Button>
                </Link>
            </div>
        </div>
    )
}
