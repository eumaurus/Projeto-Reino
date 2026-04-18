import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search, PawPrint, User, Calendar, FileText, Stethoscope,
    CommandIcon, Hash,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useDebounce } from '../../shared/hooks/useDebounce'
import { supabase } from '../../services/supabase'
import { isStaff } from '../../shared/constants/roles'
import { formatDate } from '../../shared/utils/dates'
import './global-search.css'

export default function GlobalSearch() {
    const { currentUser } = useAuth()
    const [open, setOpen]       = useState(false)
    const [term, setTerm]       = useState('')
    const [results, setResults] = useState({ pets: [], clients: [], bookings: [] })
    const [loading, setLoading] = useState(false)
    const [activeIdx, setActiveIdx] = useState(0)
    const navigate = useNavigate()

    const debounced = useDebounce(term, 200)

    useEffect(() => {
        const onKey = (e) => {
            const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
            if (cmdK) {
                e.preventDefault()
                setOpen(v => !v)
            }
            if (open && e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open])

    useEffect(() => {
        if (!open) { setTerm(''); setResults({ pets: [], clients: [], bookings: [] }); return }
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [open])

    useEffect(() => {
        if (!debounced || !open) {
            setResults({ pets: [], clients: [], bookings: [] })
            return
        }

        const run = async () => {
            setLoading(true)
            try {
                const needle = debounced.trim()
                const cleanNumbers = needle.replace(/\D/g, '')
                const staff = isStaff(currentUser)

                let petQ = supabase.from('pets').select('id, name, species, breed, owner_id, image').limit(10)
                if (staff) {
                    petQ = petQ.or(`name.ilike.%${needle}%,breed.ilike.%${needle}%,id.ilike.%${cleanNumbers || needle}%`)
                } else {
                    petQ = petQ.eq('owner_id', currentUser.id).or(`name.ilike.%${needle}%,breed.ilike.%${needle}%`)
                }

                let clientQ = null
                if (staff) {
                    clientQ = supabase.from('profiles').select('id, name, email, phone, document').eq('role', 'client').limit(10)
                    if (cleanNumbers && cleanNumbers.length >= 3) {
                        clientQ = clientQ.or(`name.ilike.%${needle}%,email.ilike.%${needle}%,document.ilike.%${cleanNumbers}%`)
                    } else {
                        clientQ = clientQ.or(`name.ilike.%${needle}%,email.ilike.%${needle}%`)
                    }
                }

                let bookingQ = supabase.from('bookings').select('id, service, requested_date, requested_time, status, pets:pet_id (name), profiles:owner_id (name)').limit(10)
                if (!staff) bookingQ = bookingQ.eq('owner_id', currentUser.id)

                const [pRes, cRes, bRes] = await Promise.all([petQ, clientQ ?? Promise.resolve({ data: null }), bookingQ])
                setResults({
                    pets:     pRes.data ?? [],
                    clients:  cRes.data ?? [],
                    bookings: (bRes.data ?? []).filter(b =>
                        b.service?.toLowerCase().includes(needle.toLowerCase())
                        || b.pets?.name?.toLowerCase().includes(needle.toLowerCase())
                        || b.profiles?.name?.toLowerCase().includes(needle.toLowerCase())
                    ),
                })
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [debounced, open, currentUser])

    const flatResults = useMemo(() => {
        const arr = []
        for (const p of results.pets)     arr.push({ type: 'pet', item: p })
        for (const c of results.clients)  arr.push({ type: 'client', item: c })
        for (const b of results.bookings) arr.push({ type: 'booking', item: b })
        return arr
    }, [results])

    useEffect(() => { setActiveIdx(0) }, [debounced])

    const goTo = (entry) => {
        setOpen(false)
        if (entry.type === 'pet') {
            navigate(isStaff(currentUser) ? `/vet/patients/${entry.item.id}` : `/dashboard/pet/${entry.item.id}`)
        } else if (entry.type === 'client') {
            navigate('/admin/clients')
        } else if (entry.type === 'booking') {
            navigate(isStaff(currentUser) ? '/vet/agenda' : '/bookings')
        }
    }

    const onKey = (e) => {
        if (!flatResults.length) return
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatResults.length - 1)) }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
        if (e.key === 'Enter')     { e.preventDefault(); goTo(flatResults[activeIdx]) }
    }

    if (!currentUser) return null

    return (
        <>
            <button
                type="button"
                className="global-search-trigger"
                onClick={() => setOpen(true)}
                title="Buscar (Ctrl+K)"
            >
                <Search size={15} />
                <span>Buscar...</span>
                <kbd>⌘K</kbd>
            </button>

            {open && (
                <div className="modal-overlay" onClick={() => setOpen(false)}>
                    <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="global-search-input">
                            <Search size={18} color="var(--c-gray-400)" />
                            <input
                                autoFocus
                                placeholder="Buscar pet, tutor, agendamento..."
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                onKeyDown={onKey}
                            />
                            <kbd>ESC</kbd>
                        </div>

                        <div className="global-search-results">
                            {loading && <div className="global-search-empty">Buscando…</div>}

                            {!loading && !term && (
                                <div className="global-search-hint">
                                    <CommandIcon size={14} /> Comece a digitar para buscar pets, tutores ou agendamentos.
                                </div>
                            )}

                            {!loading && term && flatResults.length === 0 && (
                                <div className="global-search-empty">Nada encontrado para "{term}"</div>
                            )}

                            {flatResults.length > 0 && renderSections(results, activeIdx, flatResults, goTo)}
                        </div>

                        <footer className="global-search-footer">
                            <span><kbd>↑</kbd> <kbd>↓</kbd> navegar</span>
                            <span><kbd>↵</kbd> abrir</span>
                            <span><kbd>ESC</kbd> fechar</span>
                        </footer>
                    </div>
                </div>
            )}
        </>
    )
}

function renderSections(results, activeIdx, flat, goTo) {
    const out = []
    let cursor = 0

    if (results.pets.length) {
        out.push(<div key="h-pets" className="global-search-group"><PawPrint size={12} /> Pets</div>)
        results.pets.forEach((p) => {
            const idx = cursor++
            out.push(
                <button
                    key={`pet-${p.id}`}
                    className={`global-search-item ${idx === activeIdx ? 'active' : ''}`}
                    onClick={() => goTo(flat[idx])}
                >
                    <div className="global-search-item-thumb">
                        {p.image ? <img src={p.image} alt="" /> : <PawPrint size={16} />}
                    </div>
                    <div>
                        <strong>{p.name}</strong>
                        <span>{p.species}{p.breed ? ` · ${p.breed}` : ''} · #{p.id}</span>
                    </div>
                </button>
            )
        })
    }

    if (results.clients.length) {
        out.push(<div key="h-clients" className="global-search-group"><User size={12} /> Tutores</div>)
        results.clients.forEach((c) => {
            const idx = cursor++
            out.push(
                <button
                    key={`c-${c.id}`}
                    className={`global-search-item ${idx === activeIdx ? 'active' : ''}`}
                    onClick={() => goTo(flat[idx])}
                >
                    <div className="global-search-item-thumb"><User size={16} /></div>
                    <div>
                        <strong>{c.name}</strong>
                        <span>{c.email}{c.phone ? ` · ${c.phone}` : ''}</span>
                    </div>
                </button>
            )
        })
    }

    if (results.bookings.length) {
        out.push(<div key="h-books" className="global-search-group"><Calendar size={12} /> Agendamentos</div>)
        results.bookings.forEach((b) => {
            const idx = cursor++
            out.push(
                <button
                    key={`b-${b.id}`}
                    className={`global-search-item ${idx === activeIdx ? 'active' : ''}`}
                    onClick={() => goTo(flat[idx])}
                >
                    <div className="global-search-item-thumb"><Calendar size={16} /></div>
                    <div>
                        <strong>{b.service}</strong>
                        <span>{formatDate(b.requested_date)} às {b.requested_time} · {b.pets?.name ?? '—'}</span>
                    </div>
                </button>
            )
        })
    }

    return out
}
