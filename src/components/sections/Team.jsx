import React from 'react';
import './Team.css';

const Team = () => {
    const teamMembers = [
        {
            name: 'Dra. Renata Chaves',
            crmv: 'CRMV-SP 14.348',
            role: 'Responsável Técnica e Administradora',
            description: 'Formada em 2001 pela UNIMAR, atua na clínica médica geral. Após anos de experiência em plantões e hospitais, fundou o Reino Animal há 18 anos. Seu foco é tratar cada paciente e tutor com total respeito e individualidade, contra a cultura corporativa do "ticket médio".',
            initials: 'RC'
        },
        {
            name: 'Dr. Renato T. Maurus',
            crmv: 'CRMV-SP 13.284',
            role: 'Clínico Médico Geral e Cirurgia',
            description: 'Formado no ano 2000 pela UNIMAR. Atua na área clínica e é o cirurgião principal de pequenos animais. É parceiro do Reino Animal há mais de 10 anos, liderando uma equipe cirúrgica qualificada para garantir os melhores resultados.',
            initials: 'RM'
        },
        {
            name: 'Fábio Benjamin',
            role: 'Esteticista Animal',
            description: 'Especialista em banho e tosa com mais de 20 anos de experiência na área de estética animal. Faz parte da família Reino Animal desde 2015, garantindo o cuidado estético do seu pet com toda a segurança necessária.',
            initials: 'FB'
        },
        {
            name: 'Lara Campos',
            role: 'Enfermeira Veterinária',
            description: 'Graduanda do terceiro ano em Medicina Veterinária pela Universidade São Judas Tadeu (USJT), traz atualização e cuidado constante e atencioso aos pacientes internados e em observação.',
            initials: 'LC'
        }
    ];

    return (
        <section id="team" className="section team">
            <div className="container">
                <div className="team-header header-container text-center">
                    <h2 className="section-title">Nossa Equipe</h2>
                    <h3 className="section-subtitle">Profissionais apaixonados pelo que fazem</h3>
                    <p className="section-text">
                        Uma equipe altamente qualificada, experiente e unida pelo mesmo propósito: oferecer o melhor e mais honesto cuidado para o seu animal.
                    </p>
                </div>

                <div className="team-grid">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="team-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="team-image-wrapper placeholder-wrapper" style={{
                                height: '280px',
                                backgroundColor: 'var(--color-primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                color: 'white',
                                fontWeight: 'bold'
                            }}>
                                {member.initials}
                            </div>
                            <div className="team-content">
                                <h4 className="team-name">{member.name}</h4>
                                <div className="team-role">{member.role}</div>
                                {member.crmv && <div className="team-crmv">{member.crmv}</div>}
                                <p className="team-desc">{member.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
