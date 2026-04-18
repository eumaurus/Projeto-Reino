import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
    state = { error: null }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) console.error('ErrorBoundary:', error, info)
    }

    render() {
        if (!this.state.error) return this.props.children

        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'var(--c-gray-50)',
            }}>
                <div style={{
                    maxWidth: 520,
                    padding: '2.5rem',
                    background: 'white',
                    border: '1px solid var(--c-gray-200)',
                    borderRadius: 'var(--r-xl)',
                    boxShadow: 'var(--sh-lg)',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: 72, height: 72,
                        borderRadius: '50%',
                        background: 'var(--c-danger-soft)',
                        color: 'var(--c-danger)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                    }}>
                        <AlertTriangle size={36} />
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Algo deu errado</h1>
                    <p style={{ color: 'var(--c-gray-600)', marginBottom: '2rem', fontSize: 14 }}>
                        Encontramos um erro inesperado. Recarregue a página ou volte ao início.
                        Se o problema persistir, fale com a recepção.
                    </p>
                    {import.meta.env.DEV && (
                        <pre style={{
                            background: 'var(--c-gray-900)',
                            color: '#fecaca',
                            padding: '0.75rem',
                            borderRadius: 8,
                            fontSize: 11,
                            textAlign: 'left',
                            overflow: 'auto',
                            maxHeight: 180,
                            marginBottom: '1.5rem',
                        }}>
                            {String(this.state.error?.stack ?? this.state.error)}
                        </pre>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '0.7rem 1.25rem',
                                borderRadius: 'var(--r-md)',
                                background: 'var(--brand-primary)',
                                color: 'white',
                                fontWeight: 600,
                            }}
                        >
                            Recarregar
                        </button>
                        <a
                            href="/"
                            style={{
                                padding: '0.7rem 1.25rem',
                                borderRadius: 'var(--r-md)',
                                background: 'transparent',
                                color: 'var(--brand-secondary)',
                                fontWeight: 600,
                                border: '1.5px solid var(--c-gray-200)',
                            }}
                        >
                            Início
                        </a>
                    </div>
                </div>
            </div>
        )
    }
}
