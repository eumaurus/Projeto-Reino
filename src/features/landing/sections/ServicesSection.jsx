import { Link } from 'react-router-dom'
import {
    Stethoscope, Syringe, Microscope, Scissors, Droplets, Home, ArrowRight,
} from 'lucide-react'
import Button from '../../../shared/components/ui/Button'
import '../landing.css'

const SERVICES = [
    {
        icon: Stethoscope,
        title: 'Clínica médica',
        text:  'Consultas preventivas, geriátricas e especializadas, sempre com escuta ativa e plano individualizado.',
    },
    {
        icon: Syringe,
        title: 'Vacinação',
        text:  'Protocolos atualizados de V8, V10, antirrábica, leishmaniose e muito mais — com lembretes automáticos.',
    },
    {
        icon: Microscope,
        title: 'Exames laboratoriais e de imagem',
        text:  'Hemograma, ultrassom, raio-X e citologias para diagnósticos precoces e tratamentos assertivos.',
    },
    {
        icon: Scissors,
        title: 'Cirurgias',
        text:  'Centro cirúrgico moderno com equipe especializada em pequenos animais. Segurança em cada procedimento.',
    },
    {
        icon: Droplets,
        title: 'Banho & Tosa',
        text:  'Estética animal com Fábio Benjamin, mais de 20 anos cuidando da beleza e higiene dos pets.',
    },
    {
        icon: Home,
        title: 'Consulta domiciliar',
        text:  'Conforto, menos estresse, mesma qualidade. Ideal para pets idosos, ansiosos ou pós-operatório.',
    },
]

export default function ServicesSection() {
    return (
        <section id="services" className="services-section">
            <div className="container">
                <div className="values-eyebrow animate-fade-in">Serviços completos</div>
                <h2 className="values-title animate-fade-in">Tudo para seu pet em um só lugar</h2>
                <p className="values-subtitle animate-fade-in">
                    Infraestrutura preparada para atender do rotineiro ao complexo, com o mesmo cuidado que você daria em casa.
                </p>

                <div className="services-grid">
                    {SERVICES.map(s => {
                        const Icon = s.icon
                        return (
                            <article key={s.title} className="service-card animate-fade-in">
                                <div className="service-icon"><Icon size={26} /></div>
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                            </article>
                        )
                    })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '3rem' }} className="animate-fade-in">
                    <Link to="/login">
                        <Button size="lg" iconRight={ArrowRight}>Agendar pelo portal</Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}
