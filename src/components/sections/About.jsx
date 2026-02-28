import React from 'react';
import { Target, Heart, Award, Shield } from 'lucide-react';
import './About.css';

const About = () => {
    return (
        <section id="about" className="section about">
            <div className="container">
                <div className="about-grid">

                    <div className="about-content animate-fade-in">
                        <h2 className="section-title">Nossa Essência</h2>
                        <h3 className="about-subtitle">
                            Mais de 18 anos de base e dedicação à saúde real do seu animal.
                        </h3>
                        <p className="about-text">
                            A Clínica Veterinária Reino Animal foi fundada com um propósito claro: combater a cultura corporativa do "ticket médio" na medicina veterinária. Nosso foco exclusivo é a <strong>saúde e o bem-estar real</strong> do seu pet. Cada paciente recebe apenas o tratamento que de fato necessita, com honestidade e por um preço justo.
                        </p>

                        <div className="about-differentiator">
                            <Shield className="diff-icon" size={32} />
                            <div>
                                <h4>O Nosso Grande Diferencial</h4>
                                <p>A honestidade e a individualização absoluta do tratamento. Apoiados por profissionais com mais de duas décadas de formação, transmitimos a autoridade e confiança que você procura.</p>
                            </div>
                        </div>
                    </div>

                    <div className="about-cards animate-fade-in" style={{ animationDelay: '0.2s' }}>

                        <div className="about-card">
                            <div className="card-icon-wrapper">
                                <Target size={24} className="card-icon" />
                            </div>
                            <h4>Nossa Missão</h4>
                            <p>Oferecer os melhores cuidados para cães e gatos de forma ética e individualizada, priorizando o bem-estar da relação tutor-animal.</p>
                        </div>

                        <div className="about-card">
                            <div className="card-icon-wrapper">
                                <Heart size={24} className="card-icon" />
                            </div>
                            <h4>Nossos Valores</h4>
                            <p>Atendimento humanizado, ética veterinária, transparência, carinho e zelo extremo por cada paciente.</p>
                        </div>

                        <div className="about-card full-width">
                            <div className="card-icon-wrapper">
                                <Award size={24} className="card-icon" />
                            </div>
                            <h4>Nossa Experiência</h4>
                            <p>Uma clínica consolidada há 18 anos no mesmo local em Barueri, com sucesso comprovado e a confiança de centenas de famílias.</p>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
