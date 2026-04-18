import { Link } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, Instagram, Clock, PawPrint } from 'lucide-react'
import { CLINIC } from '../../constants/clinic'
import './footer.css'

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo">
                            <div className="footer-logo-icon"><PawPrint size={22} /></div>
                            <div>
                                <strong>Reino Animal</strong>
                                <span>Clínica Veterinária</span>
                            </div>
                        </div>
                        <p>{CLINIC.tagline}</p>
                        <div className="footer-social">
                            <a href={CLINIC.instagramHref} target="_blank" rel="noreferrer" aria-label="Instagram">
                                <Instagram size={16} />
                            </a>
                            <a href={CLINIC.whatsappHref} target="_blank" rel="noreferrer" aria-label="WhatsApp">
                                <MessageCircle size={16} />
                            </a>
                            <a href={`tel:${CLINIC.phone.replace(/\D/g,'')}`} aria-label="Telefone">
                                <Phone size={16} />
                            </a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>Navegação</h4>
                        <a href="#about">Sobre nós</a>
                        <a href="#services">Serviços</a>
                        <a href="#team">Equipe</a>
                        <a href="#contact">Contato</a>
                        <Link to="/login">Portal do tutor</Link>
                    </div>

                    <div className="footer-col">
                        <h4>Contato</h4>
                        <a href={CLINIC.mapHref} target="_blank" rel="noreferrer">
                            <MapPin size={14} /> {CLINIC.address}
                        </a>
                        <a href={`tel:${CLINIC.phone.replace(/\D/g,'')}`}>
                            <Phone size={14} /> {CLINIC.phone}
                        </a>
                        <a href={CLINIC.whatsappHref} target="_blank" rel="noreferrer">
                            <MessageCircle size={14} /> {CLINIC.whatsapp}
                        </a>
                    </div>

                    <div className="footer-col">
                        <h4>Horários</h4>
                        {CLINIC.hours.map(h => (
                            <div key={h.days} style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                <Clock size={14} />
                                <span><strong style={{ color: 'white', fontWeight: 600 }}>{h.days}:</strong> {h.hours}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="footer-bottom">
                    <span>© {new Date().getFullYear()} Reino Animal · CRMV-SP 14.348</span>
                    <span>Feito com cuidado para quem ama seus pets</span>
                </div>
            </div>
        </footer>
    )
}
