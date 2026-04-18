import { Building2, Sofa, Activity, HeartPulse } from 'lucide-react'
import '../landing.css'

const AREAS = [
    { icon: Sofa,       title: 'Recepção acolhedora', text: 'Ambiente tranquilo para tutores e pets aguardarem com conforto.' },
    { icon: Building2,  title: 'Consultórios equipados', text: 'Salas limpas, iluminadas e preparadas para minimizar estresse do pet.' },
    { icon: HeartPulse, title: 'Sala de observação', text: 'Monitoramento contínuo por equipe capacitada, com atenção detalhada.' },
    { icon: Activity,   title: 'Centro cirúrgico', text: 'Moderno e preparado para cirurgias seguras de pequenos animais.' },
]

export default function StructureSection() {
    return (
        <section id="structure" className="structure-section">
            <div className="container">
                <div className="values-eyebrow animate-fade-in">Nossa estrutura</div>
                <h2 className="values-title animate-fade-in">Um ambiente pensado para o bem-estar</h2>
                <p className="values-subtitle animate-fade-in">
                    Cada espaço foi planejado para reduzir estresse, garantir segurança e proporcionar
                    atendimento tranquilo para pet e família.
                </p>

                <div className="structure-grid">
                    {AREAS.map(a => {
                        const Icon = a.icon
                        return (
                            <article key={a.title} className="structure-card animate-fade-in">
                                <div className="structure-card-icon"><Icon size={26} /></div>
                                <h3>{a.title}</h3>
                                <p>{a.text}</p>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
