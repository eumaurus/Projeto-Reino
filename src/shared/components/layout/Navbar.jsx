import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    Menu, X, PawPrint, Phone, User, ChevronDown, LogOut, Settings,
    CalendarDays, Home, LayoutDashboard, Stethoscope, Users,
    ShieldCheck, Briefcase, Moon, Sun,
} from 'lucide-react'
import { useAuth } from '../../../features/auth/AuthContext'
import { CLINIC } from '../../constants/clinic'
import { ROLE, ROLE_LABEL, isStaff, isClient, isVet, isAdmin } from '../../constants/roles'
import { useTheme } from '../../hooks/useTheme'
import NotificationBell from '../../../features/notifications/NotificationBell'
import GlobalSearch from '../../../features/search/GlobalSearch'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import './navbar.css'

const PUBLIC_LINKS = [
    { to: '#about',    label: 'Sobre'     },
    { to: '#services', label: 'Serviços'  },
    { to: '#team',     label: 'Equipe'    },
    { to: '#contact',  label: 'Contato'   },
]

const linksForRole = (role) => {
    if (role === ROLE.ADMIN) return [
        { to: '/admin',           label: 'Dashboard',  icon: LayoutDashboard },
        { to: '/vet/agenda',      label: 'Agenda',     icon: CalendarDays    },
        { to: '/vet/patients',    label: 'Pacientes',  icon: Stethoscope     },
        { to: '/admin/clients',   label: 'Clientes',   icon: Users           },
        { to: '/admin/services',  label: 'Serviços',   icon: Briefcase       },
        { to: '/admin/staff',     label: 'Equipe',     icon: ShieldCheck     },
    ]
    if (role === ROLE.VET) return [
        { to: '/vet',             label: 'Dashboard',  icon: LayoutDashboard },
        { to: '/vet/agenda',      label: 'Agenda',     icon: CalendarDays    },
        { to: '/vet/patients',    label: 'Pacientes',  icon: Stethoscope     },
    ]
    return [
        { to: '/dashboard',  label: 'Início',       icon: Home          },
        { to: '/bookings',   label: 'Agendamentos', icon: CalendarDays  },
        { to: '/booking',    label: 'Agendar',      icon: Stethoscope   },
    ]
}

export default function Navbar({ variant = 'auto' }) {
    const { currentUser, logout } = useAuth()
    const { theme, toggle: toggleTheme } = useTheme()
    const mode = variant === 'auto' ? (currentUser ? 'portal' : 'public') : variant
    const [scrolled, setScrolled] = useState(false)
    const [mobile, setMobile] = useState(false)
    const [userMenu, setUserMenu] = useState(false)
    const userMenuRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12)
        window.addEventListener('scroll', onScroll)
        onScroll()
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        setMobile(false)
        setUserMenu(false)
    }, [location.pathname])

    useEffect(() => {
        if (!userMenu) return
        const onClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [userMenu])

    const portalLinks = mode === 'portal' ? linksForRole(currentUser?.role) : []

    const isActive = (to) => {
        if (to === '/admin')  return location.pathname === '/admin'
        if (to === '/vet')    return location.pathname === '/vet'
        if (to === '/dashboard') return location.pathname === '/dashboard'
        return location.pathname.startsWith(to)
    }

    const roleHome = () => {
        if (isAdmin(currentUser))  return '/admin'
        if (isVet(currentUser))    return '/vet'
        if (isClient(currentUser)) return '/dashboard'
        return '/'
    }

    return (
        <header className={`nav ${mode === 'portal' ? 'nav-portal' : 'nav-public'} ${scrolled ? 'nav-scrolled' : ''}`}>
            <div className="nav-inner">
                <Link to={mode === 'portal' ? roleHome() : '/'} className="nav-brand">
                    <span className="nav-brand-logo"><PawPrint size={18} /></span>
                    <span className="nav-brand-text">Reino Animal</span>
                </Link>

                <nav className="nav-links" aria-label="Principal">
                    {mode === 'public' && PUBLIC_LINKS.map(l => (
                        <a key={l.to} href={l.to}>{l.label}</a>
                    ))}
                    {mode === 'portal' && portalLinks.map(l => {
                        const Icon = l.icon
                        return (
                            <Link
                                key={l.to}
                                to={l.to}
                                className={isActive(l.to) ? 'active' : ''}
                            >
                                {Icon && <Icon size={15} />}
                                {l.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="nav-actions">
                    {mode === 'public' && (
                        <>
                            <a href={`tel:${CLINIC.phone.replace(/\D/g,'')}`} className="nav-phone hide-mobile">
                                <Phone size={15} /> {CLINIC.phone}
                            </a>
                            {currentUser ? (
                                <Link to={roleHome()}>
                                    <Button variant="primary" icon={User}>Meu portal</Button>
                                </Link>
                            ) : (
                                <Link to="/login">
                                    <Button variant="primary" icon={User}>Entrar</Button>
                                </Link>
                            )}
                        </>
                    )}

                    {mode === 'portal' && currentUser && (
                        <>
                            <div className="hide-mobile"><GlobalSearch /></div>
                            <NotificationBell />
                            <div className="nav-user" ref={userMenuRef}>
                                <button
                                    type="button"
                                    className="nav-user-btn"
                                    onClick={() => setUserMenu(o => !o)}
                                >
                                    <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="sm" />
                                    <span className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--brand-secondary)', fontSize: 13 }}>
                                            {currentUser.name?.split(' ')[0]}
                                        </span>
                                        <span style={{ fontSize: 11, color: 'var(--c-gray-500)' }}>
                                            {ROLE_LABEL[currentUser.role]}
                                        </span>
                                    </span>
                                    <ChevronDown size={14} className="hide-mobile" />
                                </button>

                                {userMenu && (
                                    <div className="dd-menu" style={{ right: 0, top: 'calc(100% + 10px)' }}>
                                        <div style={{ padding: '0.5rem 0.75rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--brand-secondary)', fontSize: 14 }}>{currentUser.name}</div>
                                            <div style={{ fontSize: 12, color: 'var(--c-gray-500)' }}>{currentUser.email}</div>
                                        </div>
                                        <div className="dd-menu-separator" />
                                        <button className="dd-menu-item" onClick={() => { setUserMenu(false); navigate('/profile') }}>
                                            <User size={15} /> Meus dados
                                        </button>
                                        <button className="dd-menu-item" onClick={() => { setUserMenu(false); navigate('/profile#password') }}>
                                            <Settings size={15} /> Segurança e senha
                                        </button>
                                        <button className="dd-menu-item" onClick={toggleTheme}>
                                            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                                            Tema {theme === 'dark' ? 'claro' : 'escuro'}
                                        </button>
                                        {isStaff(currentUser) && (
                                            <button className="dd-menu-item" onClick={() => { setUserMenu(false); navigate('/') }}>
                                                <Home size={15} /> Ir ao site público
                                            </button>
                                        )}
                                        <div className="dd-menu-separator" />
                                        <button
                                            className="dd-menu-item dd-menu-item-danger"
                                            onClick={async () => { await logout(); navigate('/login') }}
                                        >
                                            <LogOut size={15} /> Sair
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <button
                        className="nav-burger hide-desktop"
                        onClick={() => setMobile(o => !o)}
                        aria-label={mobile ? 'Fechar menu' : 'Abrir menu'}
                    >
                        {mobile ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {mobile && (
                <nav className="nav-mobile hide-desktop" aria-label="Principal mobile">
                    {mode === 'public' && PUBLIC_LINKS.map(l => (
                        <a key={l.to} href={l.to} onClick={() => setMobile(false)}>{l.label}</a>
                    ))}
                    {mode === 'portal' && portalLinks.map(l => {
                        const Icon = l.icon
                        return (
                            <Link key={l.to} to={l.to} onClick={() => setMobile(false)}>
                                {Icon && <Icon size={16} />} {l.label}
                            </Link>
                        )
                    })}
                    <div className="nav-mobile-divider" />
                    {currentUser ? (
                        <>
                            <Link to="/profile" onClick={() => setMobile(false)}>
                                <User size={16} /> Meus dados
                            </Link>
                            <button onClick={async () => { await logout(); navigate('/login') }} style={{ textAlign: 'left', color: 'var(--c-danger)' }}>
                                <LogOut size={16} /> Sair
                            </button>
                        </>
                    ) : (
                        <Link to="/login" onClick={() => setMobile(false)}>
                            <User size={16} /> Entrar
                        </Link>
                    )}
                </nav>
            )}
        </header>
    )
}
