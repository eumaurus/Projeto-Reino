import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, Lock, Mail, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { maskDocument } from '../../utils/maskUtils';
import './Auth.css';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(identifier, password);
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in visible">
                <div className="auth-header">
                    <div className="auth-logo">
                        <PawPrint size={32} color="var(--color-primary)" />
                    </div>
                    <h2>Acesse sua conta</h2>
                    <p>Entre para acompanhar a saúde do seu pet</p>
                </div>

                {error && (
                    <div className="auth-error-message" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>E-mail ou CPF/CNPJ</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="E-mail ou Documento cadastrado"
                                required
                                value={identifier}
                                onChange={(e) => setIdentifier(maskDocument(e.target.value))}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="Sua senha"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>Ainda não tem conta? <Link to="/register">Cadastre-se</Link></p>
                    <Link to="/" className="back-link">Voltar para o site</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
