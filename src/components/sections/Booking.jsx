import React from 'react';
import { Phone, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import './Booking.css';

const Booking = () => {
    return (
        <section id="booking" className="section booking">
            <div className="container">
                <div className="booking-card animate-fade-in">
                    <div className="booking-content">
                        <h2 className="booking-title">Pronto para cuidar do seu melhor amigo?</h2>
                        <p className="booking-desc">
                            Agende uma consulta, banho ou exame. Nossa equipe está sempre pronta para oferecer o melhor atendimento, com honestidade e transparência. Sem sustos, com muito amor.
                        </p>

                        <div className="booking-actions">
                            <a href="https://wa.me/5511992352313" target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="booking-primary-btn" icon={<CalendarCheck size={20} />}>
                                    Agendar pelo WhatsApp
                                </Button>
                            </a>
                            <div className="booking-phone">
                                <Phone size={18} className="phone-icon" />
                                <span>Ou ligue: <strong>(11) 4198-4301</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="booking-image-wrapper">
                        <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop" alt="Cão e Gato juntos" className="booking-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Booking;
