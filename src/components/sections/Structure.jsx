import React from 'react';
import { Sparkles, Droplet, Stethoscope, Sofa } from 'lucide-react';
import './Structure.css';

const Structure = () => {
    const facilities = [
        {
            icon: <Sparkles size={32} />,
            title: 'Consultórios',
            description: 'Ambientes limpos, acolhedores e totalmente equipados para garantir o conforto do seu pet durante as consultas.'
        },
        {
            icon: <Droplet size={32} />,
            title: 'Banho e Tosa Especializado',
            description: 'Espaço dedicado à estética animal e ao relaxamento, com equipamentos seguros e supervisão constante.'
        },
        {
            icon: <Stethoscope size={32} />,
            title: 'Centro Cirúrgico',
            description: 'Estrutura moderna e altamente equipada, liderada pelo Dr. Renato, para a realização de cirurgias seguras e eficientes em pequenos animais.'
        },
        {
            icon: <Sofa size={32} />,
            title: 'Recepção',
            description: 'Uma sala de espera confortável e acolhedora, projetada para minimizar o estresse reduzindo a ansiedade dos tutores e seus animais.'
        }
    ];

    return (
        <section id="structure" className="section structure">
            <div className="container">
                <div className="text-center structure-header header-container">
                    <h2 className="section-title">Nossa Estrutura</h2>
                    <h3 className="section-subtitle">Um ambiente projetado para o bem-estar</h3>
                    <p className="section-text">
                        Toda a nossa infraestrutura foi pensada detalhadamente para minimizar o estresse dos animais e oferecer a maior segurança possível durante qualquer procedimento.
                    </p>
                </div>

                <div className="structure-grid">
                    {facilities.map((facility, index) => (
                        <div key={index} className="structure-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="structure-icon">
                                {facility.icon}
                            </div>
                            <h4 className="structure-card-title">{facility.title}</h4>
                            <p className="structure-card-desc">{facility.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Structure;
