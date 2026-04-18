import { initials } from '../../../shared/utils/formatters'
import '../landing.css'

const TEAM = [
    {
        name: 'Dra. Renata Chaves',
        role: 'Responsável Técnica',
        crmv: 'CRMV-SP 14.348',
        bio:  'Formada pela UNIMAR (2001). Fundou o Reino Animal há 18 anos para ir contra a cultura do "ticket médio", colocando o paciente e o tutor no centro de cada decisão.',
    },
    {
        name: 'Dr. Renato T. Maurus',
        role: 'Clínica e Cirurgia',
        crmv: 'CRMV-SP 13.284',
        bio:  'Formado pela UNIMAR (2000). Cirurgião principal de pequenos animais, parceiro do Reino há mais de uma década. Apaixonado por animais desde sempre.',
    },
    {
        name: 'Fábio Benjamin',
        role: 'Esteticista Animal',
        crmv: 'Banho & Tosa',
        bio:  'Mais de 20 anos de experiência em estética animal. Faz parte da família Reino desde 2015, garantindo cuidado estético com segurança e carinho.',
    },
    {
        name: 'Lara Campos',
        role: 'Enfermeira Veterinária',
        crmv: 'Graduanda USJT',
        bio:  'Cursando o terceiro ano de Medicina Veterinária pela USJT. Acompanha com atenção constante pacientes em observação e internados.',
    },
]

export default function TeamSection() {
    return (
        <section id="team" className="team-section">
            <div className="container">
                <div className="values-eyebrow animate-fade-in">Conheça nossa equipe</div>
                <h2 className="values-title animate-fade-in">Profissionais apaixonados por animais</h2>
                <p className="values-subtitle animate-fade-in">
                    Duas décadas de formação, uma vida inteira de dedicação. Nossa equipe está pronta
                    para cuidar do seu pet como parte da família.
                </p>

                <div className="team-grid">
                    {TEAM.map(p => (
                        <article key={p.name} className="team-card animate-fade-in">
                            <div className="team-card-photo">
                                <span className="team-card-initials">{initials(p.name)}</span>
                            </div>
                            <div className="team-card-body">
                                <div className="team-card-role">{p.role}</div>
                                <h3 className="team-card-name">{p.name}</h3>
                                <div className="team-card-crmv">{p.crmv}</div>
                                <p className="team-card-bio">{p.bio}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
