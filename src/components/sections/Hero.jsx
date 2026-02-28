import React from 'react';
import { Heart, ShieldCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import './Hero.css';

const Hero = () => {
    return (
        <section id="home" className="hero">
            <div className="hero-background"></div>
            <div className="container hero-container">
                <div className="hero-content animate-fade-in">
                    <div className="hero-badge">
                        <Heart size={16} className="hero-badge-icon" />
                        <span>18 anos de tradição em Barueri</span>
                    </div>
                    <h1 className="hero-title">
                        Cuidado excepcional e personalizado para o seu pet.
                    </h1>
                    <p className="hero-subtitle">
                        Mais do que uma clínica veterinária, somos o porto seguro do seu amigo.
                        Sem metas de vendas, focados apenas no <strong>bem-estar real</strong> e no tratamento que ele realmente precisa.
                    </p>

                    <div className="hero-actions">
                        <Link to="/booking">
                            <Button size="lg" className="hero-btn">Agendar Consulta Agora</Button>
                        </Link>
                        <a href="#services">
                            <Button variant="outline" size="lg" className="hero-btn-outline">Ver Serviços</Button>
                        </a>
                    </div>

                    <div className="hero-features">
                        <div className="hero-feature">
                            <ShieldCheck size={24} className="feature-icon" />
                            <span>Diagnóstico Preciso e Honesto</span>
                        </div>
                        <div className="hero-feature">
                            <Clock size={24} className="feature-icon" />
                            <span>Atendimento Humanizado</span>
                        </div>
                    </div>
                </div>

                <div className="hero-image-wrapper animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {/* Will use an image from Unsplash or a generated placeholder */}
                    <img
                        src="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=1000&auto=format&fit=crop"
                        alt="Cachorro feliz recebendo carinho"
                        className="hero-image"
                    />
                    <div className="hero-image-card">
                        <div className="card-avatar">👨‍⚕️</div>
                        <div className="card-text">
                            <strong>Equipe Especializada</strong>
                            <span>+20 anos de experiência</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
