import { Link } from 'react-router-dom'
import { ArrowLeft, PawPrint, ShieldCheck, Heart, Sparkles } from 'lucide-react'
import { CLINIC } from '../../shared/constants/clinic'
import './auth.css'

export default function AuthLayout({ children }) {
    return (
        <div className="auth-page">
            <section className="auth-panel">
                <div className="auth-panel-form">
                    <Link to="/" className="auth-back-home">
                        <ArrowLeft size={14} /> Voltar ao site
                    </Link>
                    <header>
                        <div className="auth-brand">
                            <div className="auth-brand-logo">
                                <PawPrint size={20} />
                            </div>
                            Reino Animal
                        </div>
                    </header>
                    {children}
                </div>
            </section>

            <aside className="auth-aside">
                <div className="auth-aside-content">
                    <div className="auth-aside-eyebrow">
                        <Sparkles size={13} /> Portal do tutor
                    </div>
                    <h2>Cuidado que combina com a sua rotina.</h2>
                    <p>{CLINIC.tagline} Acompanhe a saúde do seu pet, agende consultas e mantenha o histórico médico sempre à mão.</p>

                    <div className="auth-aside-highlights">
                        <div className="auth-aside-highlight">
                            <span className="auth-aside-highlight-icon"><ShieldCheck size={18} /></span>
                            <div>
                                <strong>18 anos de tradição</strong>
                                <span>Histórico sólido em Barueri, com foco no bem-estar real do animal.</span>
                            </div>
                        </div>
                        <div className="auth-aside-highlight">
                            <span className="auth-aside-highlight-icon"><Heart size={18} /></span>
                            <div>
                                <strong>Zero cultura de "ticket médio"</strong>
                                <span>Cada paciente recebe apenas o tratamento que realmente precisa.</span>
                            </div>
                        </div>
                        <div className="auth-aside-highlight">
                            <span className="auth-aside-highlight-icon"><PawPrint size={18} /></span>
                            <div>
                                <strong>Prontuário sempre acessível</strong>
                                <span>Vacinas, exames, receitas e consultas do seu pet em um só lugar.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    )
}
