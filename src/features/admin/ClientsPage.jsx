import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Users, Phone, Mail, Trash2, Key, MoreVertical, PawPrint,
    CalendarDays, FileBadge,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { listClients, deleteProfile } from '../../services/profiles.service'
import { listAllPets } from '../../services/pets.service'
import { listAllBookings } from '../../services/bookings.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import SearchBox from '../../shared/components/ui/SearchBox'
import EmptyState from '../../shared/components/ui/EmptyState'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Avatar from '../../shared/components/ui/Avatar'
import Button from '../../shared/components/ui/Button'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import { useToast } from '../../shared/components/ui/Toast'
import { formatDocument } from '../../shared/utils/masks'
import { formatDate } from '../../shared/utils/dates'

export default function ClientsPage() {
    const toast = useToast()
    const clients  = useAsync(() => listClients(), [])
    const pets     = useAsync(() => listAllPets(), [])
    const bookings = useAsync(() => listAllBookings(), [])
    const [term, setTerm] = useState('')
    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const debounced = useDebounce(term, 200)

    const enriched = useMemo(() => {
        const petsByOwner     = new Map()
        const bookingsByOwner = new Map()
        for (const p of pets.data ?? []) {
            if (!petsByOwner.has(p.ownerId)) petsByOwner.set(p.ownerId, [])
            petsByOwner.get(p.ownerId).push(p)
        }
        for (const b of bookings.data ?? []) {
            if (!bookingsByOwner.has(b.ownerId)) bookingsByOwner.set(b.ownerId, [])
            bookingsByOwner.get(b.ownerId).push(b)
        }
        return (clients.data ?? []).map(c => ({
            ...c,
            pets:     petsByOwner.get(c.id) ?? [],
            bookings: bookingsByOwner.get(c.id) ?? [],
        }))
    }, [clients.data, pets.data, bookings.data])

    const filtered = useMemo(() => {
        const needle = debounced.toLowerCase().trim()
        if (!needle) return enriched
        return enriched.filter(c =>
            c.name?.toLowerCase().includes(needle) ||
            c.email?.toLowerCase().includes(needle) ||
            (c.document ?? '').includes(needle.replace(/\D/g,'')) ||
            (c.phone ?? '').includes(needle.replace(/\D/g,''))
        )
    }, [enriched, debounced])

    const confirmDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await deleteProfile(toDelete.id)
            toast.success('Cliente removido.')
            setToDelete(null)
            clients.refetch()
            pets.refetch()
            bookings.refetch()
        } catch (e) {
            toast.error(e.message ?? 'Falha ao remover cliente.')
        } finally {
            setDeleting(false)
        }
    }

    const loading = clients.loading || pets.loading || bookings.loading

    return (
        <>
            <PageHeader
                eyebrow="Gestão de clientes"
                title="Tutores cadastrados"
                subtitle={`${enriched.length} tutor(es) com ${pets.data?.length ?? 0} pet(s) ativos.`}
            />

            <div style={{ maxWidth: 460, marginBottom: '1.5rem' }}>
                <SearchBox value={term} onChange={setTerm} placeholder="Buscar por nome, e-mail, CPF ou telefone..." />
            </div>

            {loading && <SkeletonRows rows={4} height={80} />}
            {!loading && filtered.length === 0 && (
                <EmptyState icon={Users} title="Nenhum cliente encontrado" description={term ? 'Ajuste a busca.' : 'Convide tutores a criar conta no portal.'} />
            )}

            <div className="stack gap-2">
                {filtered.map(c => (
                    <div key={c.id} className="client-row">
                        <Avatar name={c.name} />
                        <div>
                            <strong>{c.name}</strong>
                            <span><Mail size={12} style={{ verticalAlign: 'middle' }} /> {c.email}</span>
                            {c.document && <span><FileBadge size={12} style={{ verticalAlign: 'middle' }} /> {formatDocument(c.document)}</span>}
                        </div>
                        <div>
                            {c.phone && (
                                <a href={`tel:${c.phone.replace(/\D/g,'')}`} style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: 13 }}>
                                    <Phone size={12} style={{ verticalAlign: 'middle' }} /> {c.phone}
                                </a>
                            )}
                            <span>Cadastrado em {formatDate(c.created_at)}</span>
                        </div>
                        <div>
                            <span><PawPrint size={12} style={{ verticalAlign: 'middle' }} /> {c.pets.length} pet(s)</span>
                            <span><CalendarDays size={12} style={{ verticalAlign: 'middle' }} /> {c.bookings.length} agendamento(s)</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setToDelete(c)} />
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Remover este cliente?"
                description={toDelete ? `Isso excluirá ${toDelete.name}, seus ${toDelete.pets?.length ?? 0} pet(s) e todos os dados clínicos vinculados. Essa ação é permanente.` : ''}
                loading={deleting}
                confirmLabel="Sim, excluir"
            />
        </>
    )
}
