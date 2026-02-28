import React from 'react';
import { Droplet, Syringe, Activity, Scissors, Microscope, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import './Services.css';

const Services = () => {
    const services = [
        {
            icon: <HeartPulse size={28} />,
            title: 'Clínica Médica Geral',
            description: 'Consultas preventivas e tratamentos especializados para manter a saúde do seu pet em dia com acompanhamento da Dra. Renata.',
        },
        {
            icon: <Droplet size={28} />,
            title: 'Banho e Tosa',
            description: 'Cuidado estético profissional e seguro. Beleza e higiene com os cuidados especialistas do Fábio Benjamin.',
        },
        {
            icon: <Syringe size={28} />,
            title: 'Vacinação',
            description: 'Proteção contínua e protocolos de imunização atualizados com as melhores vacinas do mercado para a longevidade do pet.',
        },
        {
            icon: <Activity size={28} />,
            title: 'Cirurgia',
            description: 'Procedimentos seguros em animais de pequeno porte, liderados pelo experiente Dr. Renato T. Maurus.',
        },
        {
            icon: <Microscope size={28} />,
            title: 'Exames',
            description: 'Exames laboratoriais e de imagem no local para diagnósticos precisos e precoces, garantindo o melhor planejamento terapêutico.',
        },
        {
            icon: <Scissors size={28} />,
            title: 'Estética Humanizada',
            description: 'Não é apenas "limpeza". É um momento de relaxamento para o pet com produtos hipoalergênicos e cuidado extremo.',
        }
    ];

    return (
        <section id="services" className="section services">
            <div className="container">
                <div className="services-header header-container text-center">
                    <h2 className="section-title">Nossos Serviços</h2>
                    <h3 className="section-subtitle">Tudo que seu pet precisa em um só lugar</h3>
                    <p className="section-text">
                        Não somos pet shop. Acreditamos que a medicina veterinária vai muito além de vender produtos. Oferecemos serviços integrados e completos para a saúde prolongada e a beleza do seu melhor amigo.
                    </p>
                </div>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div key={index} className="service-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="service-icon">
                                {service.icon}
                            </div>
                            <h4 className="service-title">{service.title}</h4>
                            <p className="service-desc">{service.description}</p>
                        </div>
                    ))}
                </div>

                <div className="services-cta text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <p className="services-cta-text">Precisa de um atendimento especializado? <strong>Agende uma consulta.</strong></p>
                    <Link to="/booking">
                        <Button size="lg" className="services-btn">Agendar Atendimento</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Services;
