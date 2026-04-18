import { Heart, ShieldCheck, Eye, HandHeart } from 'lucide-react'
import '../landing.css'

const VALUES = [
    {
        icon: Heart,
        title: 'Atendimento humanizado',
        text:  'Cada paciente recebe tempo, escuta e carinho. Nada de fila apressada — o tutor participa das decisões.',
    },
    {
        icon: ShieldCheck,
        title: 'Ética veterinária',
        text:  'Tratamos o que é preciso. Zero cultura de "ticket médio": prescrições e procedimentos com base real no paciente.',
    },
    {
        icon: Eye,
        title: 'Transparência total',
        text:  'Explicamos diagnósticos, alternativas e custos antes. Sem surpresas — só informação clara e honesta.',
    },
    {
        icon: HandHeart,
        title: 'Confiança que acompanha',
        text:  'Prontuário digital, histórico vacinal e receitas sempre disponíveis no portal do tutor. A saúde do pet nunca fica perdida.',
    },
]

export default function ValuesSection() {
    return (
        <section id="about" className="values-section">
            <div className="container">
                <div className="values-eyebrow animate-fade-in">O diferencial Reino Animal</div>
                <h2 className="values-title animate-fade-in">Por que famílias confiam há 18 anos</h2>
                <p className="values-subtitle animate-fade-in">
                    Fundada em Barueri pela Dra. Renata Chaves, a Reino Animal nasceu para ir contra a cultura
                    corporativa do "ticket médio". Aqui o foco é a saúde real do animal — e a tranquilidade da família.
                </p>

                <div className="values-grid">
                    {VALUES.map(v => {
                        const Icon = v.icon
                        return (
                            <article key={v.title} className="value-card animate-fade-in">
                                <div className="value-icon"><Icon size={24} /></div>
                                <h3>{v.title}</h3>
                                <p>{v.text}</p>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
