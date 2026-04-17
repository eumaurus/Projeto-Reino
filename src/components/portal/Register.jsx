import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { registerUser } from '../../utils/db';
import { maskDocument, maskPhone } from '../../utils/maskUtils';
import './Auth.css';

const Register = () => {
    const [name, setName] = useState('');
    const [document, setDocument] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await registerUser({ name, document, email, phone, password });
        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError(result.message);
        }
    };

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card animate-fade-in visible" style={{ textAlign: 'center', padding: '3rem' }}>
                    <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ marginBottom: '1rem' }}>Conta criada!</h2>
                    <p style={{ color: 'var(--color-neutral-700)', marginBottom: '2rem' }}>
                        Sua conta foi criada com sucesso. Redirecionando para o login...
                    </p>
                    <Button onClick={() => navigate('/login')} style={{ width: '100%' }}>Ir para Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card animate-fade-in visible">
                <div className="auth-header">
                    <div className="auth-logo">
                        <PawPrint size={32} color="var(--color-primary)" />
                    </div>
                    <h2>Crie sua conta</h2>
                    <p>Cadastre-se para cuidar melhor do seu pet</p>
                </div>

                {error && (
                    <div className="auth-error-message" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleRegister}>
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <div className="input-with-icon">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Como seu nome está no cadastro do pet?"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>CPF ou CNPJ</label>
                        <div className="input-with-icon">
                            <AlertCircle size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="000.000.000-00"
                                required
                                value={document}
                                onChange={(e) => setDocument(maskDocument(e.target.value))}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>E-mail</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Seu melhor e-mail"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>WhatsApp / Telefone</label>
                        <div className="input-with-icon">
                            <Phone size={18} className="input-icon" />
                            <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                required
                                value={phone}
                                onChange={(e) => setPhone(maskPhone(e.target.value))}
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
                                placeholder="Crie uma senha segura"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', paddingLeft: '2.5rem' }}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Conta'}
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>Já tem uma conta? <Link to="/login">Entre agora</Link></p>
                    <Link to="/" className="back-link">Voltar para o site</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
