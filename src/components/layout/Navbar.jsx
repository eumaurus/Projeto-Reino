import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Phone, User, ChevronDown, Settings, LogOut, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const isHome = location.pathname === '/';
    const isLogged = !!currentUser;

    // Extract first name and initial
    const firstName = currentUser ? currentUser.name.split(' ')[0] : '';
    const initial = currentUser && currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '';
    const isAdmin = currentUser?.role === 'admin';
    const isVet = currentUser?.role === 'vet';
    const isProfessional = isAdmin || isVet;

    const getHref = (href) => {
        return isHome ? href : `/${href}`;
    };

    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const navLinks = [
        { name: 'Início', href: '#home' },
        { name: 'Sobre', href: '#about' },
        { name: 'Estrutura', href: '#structure' },
        { name: 'Serviços', href: '#services' },
        { name: 'Equipe', href: '#team' },
    ];

    return (
        <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container nav-container">
                <Link to="/" className="logo">
                    <img src={logoImg} alt="Clínica Veterinária Reino Animal" className="logo-img" />
                </Link>

                {/* Desktop Nav */}
                <nav className="desktop-nav">
                    <ul className="nav-list">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <a href={getHref(link.href)} className="nav-link">{link.name}</a>
                            </li>
                        ))}
                        {isLogged && currentUser.role === 'client' && (
                            <li>
                                <Link to="/dashboard" className="nav-link" style={{ color: 'var(--color-primary-dark)', fontWeight: '600' }}>
                                    Meus Pets
                                </Link>
                            </li>
                        )}
                        {isLogged && isProfessional && (
                            <li>
                                <Link to="/admin" className="nav-link" style={{ color: 'var(--color-primary-dark)', fontWeight: '600' }}>
                                    {isAdmin ? 'Painel Admin' : 'Painel Vet'}
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="nav-actions">
                    {isProfessional ? (
                        <Link to="/admin">
                            <Button className="booking-btn" icon={<Plus size={18} />}>
                                Consulta
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/booking">
                            <Button className="booking-btn" icon={<Phone size={18} />}>
                                Agendar
                            </Button>
                        </Link>
                    )}

                    {isLogged ? (
                        <div className="user-profile-menu" ref={userMenuRef}>
                            <button
                                className="user-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsUserMenuOpen(!isUserMenuOpen);
                                }}
                            >
                                <div className="user-avatar" style={{ fontWeight: 'bold' }}>
                                    {initial ? initial : <User size={20} color="var(--color-primary-dark)" />}
                                </div>
                                <span className="user-name">{firstName}</span>
                                <ChevronDown size={16} color="var(--color-neutral-600)" />
                            </button>

                            {isUserMenuOpen && (
                                <div className="user-dropdown" style={{ animation: 'fadeIn 0.3s ease forwards' }}>
                                    <div className="dropdown-header">
                                        <strong>{currentUser.name}</strong>
                                        <span>{currentUser.email}</span>
                                    </div>
                                    <Link to="/dashboard" className="dropdown-item">Conta e Pets</Link>
                                    <span className="dropdown-item" onClick={() => { setIsSettingsModalOpen(true); setIsUserMenuOpen(false); }}>
                                        <Settings size={16} /> Configurações
                                    </span>
                                    <button className="dropdown-item text-danger" style={{ width: '100%', textAlign: 'left' }} onClick={() => {
                                        setIsUserMenuOpen(false);
                                        logout();
                                        navigate('/login');
                                    }}>
                                        <LogOut size={16} /> Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="booking-btn-outline">Entrar / Criar Conta</Link>
                    )}

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ marginLeft: '1rem' }}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
                <ul className="mobile-nav-list">
                    {navLinks.map((link) => (
                        <li key={link.name}>
                            <a
                                href={getHref(link.href)}
                                className="mobile-nav-link"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </a>
                        </li>
                    ))}
                    {isLogged && (
                        <li>
                            <Link to="/dashboard" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                                Meus Pets
                            </Link>
                        </li>
                    )}
                    {isLogged && (
                        <li>
                            <button className="mobile-nav-link text-danger" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }} onClick={() => {
                                setIsMobileMenuOpen(false);
                                logout();
                                navigate('/login');
                            }}>
                                Sair da Conta
                            </button>
                        </li>
                    )}
                    <li className="mobile-nav-cta">
                        <Link to={isProfessional ? "/admin" : "/booking"} onClick={() => setIsMobileMenuOpen(false)}>
                            <Button style={{ width: '100%' }} icon={isProfessional ? <Plus size={18} /> : <Phone size={18} />}>
                                {isProfessional ? 'Marcar Consulta' : 'Agendar Consulta'}
                            </Button>
                        </Link>
                    </li>
                </ul>
            </div>

            {/* Modal de Configurações / Segurança */}
            {isSettingsModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
                    <div className="modal-content" style={{ animation: 'fadeIn 0.3s ease forwards', backgroundColor: 'white', padding: '2.5rem', borderRadius: '1.5rem', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', backgroundColor: 'rgba(115, 198, 232, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Settings size={32} color="var(--color-primary-dark)" />
                        </div>
                        <h3 style={{ color: 'var(--color-secondary)', marginBottom: '1rem', fontSize: '1.35rem' }}>Configurações da Conta</h3>
                        <p style={{ color: 'var(--color-neutral-700)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: '1.6' }}>
                            Para garantir a segurança dos dados, alterações cadastrais de tutores (nome, e-mail, telefone) devem ser solicitadas diretamente na recepção da clínica ou via WhatsApp.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a href="https://wa.me/5511992352313" target="_blank" rel="noopener noreferrer" style={{ width: '100%' }}>
                                <Button style={{ width: '100%' }}>Solicitar Alteração</Button>
                            </a>
                            <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} style={{ width: '100%' }}>
                                Voltar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
