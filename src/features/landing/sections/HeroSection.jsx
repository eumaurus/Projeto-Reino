import { Link } from 'react-router-dom'
import { Calendar, MessageCircle, Heart, ShieldCheck, Award, Sparkles } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import { CLINIC } from '../../../shared/constants/clinic'
import '../landing.css'

export default function HeroSection() {
    return (
        <section className="hero">
            <div className="container">
                <div className="hero-inner">
                    <div className="animate-fade-in visible">
                        <div className="hero-eyebrow">
                            <Sparkles size={13} /> Clínica Veterinária em Barueri
                        </div>
                        <h1>
                            Cuidado <em>excepcional e personalizado</em> para cada paciente peludo
                        </h1>
                        <p className="hero-lead">
                            {CLINIC.tagline} Com 18 anos de tradição, tratamos cães e gatos
                            com ética, transparência e zero cultura de "ticket médio".
                        </p>
                        <div className="hero-actions">
                            <a href={CLINIC.whatsappHref} target="_blank" rel="noreferrer">
                                <Button size="lg" icon={MessageCircle}>Agendar pelo WhatsApp</Button>
                            </a>
                            <Link to="/login">
                                <Button size="lg" variant="outline" icon={Calendar}>Portal do tutor</Button>
                            </Link>
                        </div>
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <strong>18+</strong>
                                <span>Anos de experiência</span>
                            </div>
                            <div className="hero-stat">
                                <strong>12k+</strong>
                                <span>Pets atendidos</span>
                            </div>
                            <div className="hero-stat">
                                <strong>100%</strong>
                                <span>Atendimento humanizado</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual animate-fade-in">
                        <div className="hero-visual-main">
                            <span className="hero-visual-emoji">🐾</span>
                        </div>

                        <div className="hero-badge hero-badge-1">
                            <div className="hero-badge-icon"><Heart size={16} /></div>
                            <div>
                                <strong>Atendimento humanizado</strong>
                                <span>Cada pet é único</span>
                            </div>
                        </div>
                        <div className="hero-badge hero-badge-2">
                            <div className="hero-badge-icon"><ShieldCheck size={16} /></div>
                            <div>
                                <strong>Ética veterinária</strong>
                                <span>Sem ticket médio</span>
                            </div>
                        </div>
                        <div className="hero-badge hero-badge-3">
                            <div className="hero-badge-icon"><Award size={16} /></div>
                            <div>
                                <strong>CRMV-SP 14.348</strong>
                                <span>Reconhecida</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
