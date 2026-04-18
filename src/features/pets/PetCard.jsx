import { Link } from 'react-router-dom'
import { PawPrint, Cat, Dog, ArrowRight, ShieldCheck, Calendar } from 'lucide-react'
import { formatDate } from '../../shared/utils/dates'
import './pet-card.css'

const speciesIcon = (species) => {
    const s = (species ?? '').toLowerCase()
    if (s.startsWith('cat') || s.startsWith('gat')) return Cat
    if (s.startsWith('cach') || s.startsWith('dog')) return Dog
    return PawPrint
}

export default function PetCard({ pet }) {
    const Icon = speciesIcon(pet.species)
    const latestVaccine = (pet.vaccines ?? [])
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]

    return (
        <Link to={`/dashboard/pet/${pet.id}`} className="pet-card">
            <div className="pet-card-cover">
                {pet.image
                    ? <img src={pet.image} alt={pet.name} />
                    : <div className="pet-card-cover-empty"><Icon size={52} /></div>
                }
                <span className="pet-card-chip">
                    <Icon size={13} /> {pet.species}
                </span>
            </div>
            <div className="pet-card-body">
                <div className="pet-card-head">
                    <div>
                        <strong>{pet.name}</strong>
                        <span>{pet.breed ?? 'SRD'}{pet.age ? ` · ${pet.age}` : ''}</span>
                    </div>
                    <ArrowRight size={18} className="pet-card-arrow" />
                </div>

                <div className="pet-card-meta">
                    {pet.weight && (
                        <div>
                            <span className="pet-card-meta-label">Peso</span>
                            <span className="pet-card-meta-value">{pet.weight}</span>
                        </div>
                    )}
                    <div>
                        <span className="pet-card-meta-label">Última vacina</span>
                        <span className="pet-card-meta-value">
                            <ShieldCheck size={13} /> {latestVaccine ? formatDate(latestVaccine.date) : '—'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
