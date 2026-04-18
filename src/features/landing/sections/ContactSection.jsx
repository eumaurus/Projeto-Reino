import { MapPin, Phone, MessageCircle, Clock, Instagram, Calendar } from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import { CLINIC } from '../../../shared/constants/clinic'
import '../landing.css'

export default function ContactSection() {
    return (
        <section id="contact" className="contact-section">
            <div className="container">
                <div className="contact-content">
                    <div className="animate-fade-in">
                        <h2>Vamos cuidar do seu melhor amigo?</h2>
                        <p>
                            Estamos em Barueri, prontos para receber você e seu pet. Agende pelo WhatsApp
                            para atendimento rápido ou use o portal para acompanhar tudo de casa.
                        </p>
                        <div className="contact-cta-buttons">
                            <a href={CLINIC.whatsappHref} target="_blank" rel="noreferrer">
                                <Button variant="primary" size="lg" icon={MessageCircle}>Conversar no WhatsApp</Button>
                            </a>
                            <a href={`tel:${CLINIC.phone.replace(/\D/g,'')}`}>
                                <Button variant="outline" size="lg" icon={Phone} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.35)' }}>
                                    Ligar agora
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="contact-info animate-fade-in">
                        <h3><Calendar size={18} /> Informações e horários</h3>

                        <div className="contact-info-item">
                            <div className="contact-info-item-icon"><MapPin size={16} /></div>
                            <div>
                                <strong>Endereço</strong>
                                <span>{CLINIC.address}</span>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <div className="contact-info-item-icon"><Phone size={16} /></div>
                            <div>
                                <strong>Telefone</strong>
                                <span>{CLINIC.phone}</span>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <div className="contact-info-item-icon"><MessageCircle size={16} /></div>
                            <div>
                                <strong>WhatsApp / Agendamentos</strong>
                                <span>{CLINIC.whatsapp}</span>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <div className="contact-info-item-icon"><Instagram size={16} /></div>
                            <div>
                                <strong>Instagram</strong>
                                <span>{CLINIC.instagram}</span>
                            </div>
                        </div>

                        <div className="contact-info-item">
                            <div className="contact-info-item-icon"><Clock size={16} /></div>
                            <div>
                                <strong>Horários</strong>
                                {CLINIC.hours.map(h => (
                                    <span key={h.days} style={{ display: 'block' }}>
                                        {h.days}: {h.hours}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
