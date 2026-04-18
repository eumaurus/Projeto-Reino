import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Stethoscope, PawPrint, Cat, Dog, Plus } from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { listAllPets } from '../../services/pets.service'
import { useDebounce } from '../../shared/hooks/useDebounce'
import PageHeader from '../../shared/components/ui/PageHeader'
import SearchBox from '../../shared/components/ui/SearchBox'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Button from '../../shared/components/ui/Button'
import CreatePetModal from './CreatePetModal'

const speciesIcon = (s) => {
    const v = (s ?? '').toLowerCase()
    if (v.startsWith('cat') || v.startsWith('gat')) return Cat
    if (v.startsWith('cach') || v.startsWith('dog')) return Dog
    return PawPrint
}

export default function PatientListPage() {
    const navigate = useNavigate()
    const query = useAsync(() => listAllPets(), [])
    const [term, setTerm] = useState('')
    const [createOpen, setCreateOpen] = useState(false)
    const debounced = useDebounce(term, 200)

    const pets = query.data ?? []

    const filtered = useMemo(() => {
        const needle = debounced.toLowerCase().trim()
        if (!needle) return pets
        return pets.filter(p =>
            p.name?.toLowerCase().includes(needle) ||
            p.breed?.toLowerCase().includes(needle) ||
            p.owner?.name?.toLowerCase().includes(needle) ||
            p.id.includes(needle)
        )
    }, [pets, debounced])

    return (
        <>
            <PageHeader
                eyebrow="Pacientes"
                title="Lista de pacientes"
                subtitle="Busque pelo nome do pet, tutor, raça ou código. Clique para abrir o prontuário completo."
                actions={<Button icon={Plus} onClick={() => setCreateOpen(true)}>Cadastrar paciente</Button>}
            />

            <div style={{ maxWidth: 420, marginBottom: '1.5rem' }}>
                <SearchBox value={term} onChange={setTerm} placeholder="Buscar pet, tutor, raça, código..." />
            </div>

            {query.loading && <SkeletonRows rows={4} height={80} />}

            {!query.loading && filtered.length === 0 && (
                <EmptyState
                    icon={Stethoscope}
                    title="Nenhum paciente encontrado"
                    description={term ? 'Tente outra busca.' : 'Ainda não há pets cadastrados na clínica.'}
                    action={!term && <Button icon={Plus} onClick={() => setCreateOpen(true)}>Cadastrar primeiro paciente</Button>}
                />
            )}

            <div className="patient-list">
                {filtered.map(p => {
                    const Icon = speciesIcon(p.species)
                    return (
                        <Link key={p.id} to={`/vet/patients/${p.id}`} className="patient-card">
                            <div className="patient-card-photo">
                                {p.image ? <img src={p.image} alt={p.name} /> : <Icon size={22} />}
                            </div>
                            <div className="patient-card-info">
                                <strong>{p.name}</strong>
                                <span>{p.breed ?? p.species}{p.age ? ` · ${p.age}` : ''}</span>
                                <span style={{ color: 'var(--c-gray-600)', fontWeight: 500 }}>Tutor: {p.owner?.name ?? '—'}</span>
                                <small>#{p.id}</small>
                            </div>
                        </Link>
                    )
                })}
            </div>

            <CreatePetModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={({ petId }) => {
                    setCreateOpen(false)
                    navigate(`/vet/patients/${petId}`)
                }}
            />
        </>
    )
}
