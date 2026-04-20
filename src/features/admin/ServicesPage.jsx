import { useEffect, useMemo, useState } from 'react'
import {
    Briefcase, Plus, Trash2, Edit3, Stethoscope, Syringe, Microscope,
    Scissors, Droplets, Home, ActivitySquare, Sparkles, Save, Heart, PawPrint,
    Bath, Bandage, Pill, CircleDollarSign, Clock, Check,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { listServices, upsertService, deleteService } from '../../services/catalog.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import Modal from '../../shared/components/ui/Modal'
import FormField from '../../shared/components/ui/FormField'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Badge from '../../shared/components/ui/Badge'
import { useToast } from '../../shared/components/ui/Toast'
import { formatBRL } from '../../shared/utils/formatters'
import './admin.css'

const ICON_MAP = {
    Stethoscope, Syringe, Microscope, Scissors, Droplets, Home, ActivitySquare,
    Sparkles, Briefcase, Heart, PawPrint, Bath, Bandage, Pill,
}
const ICON_LIST = Object.keys(ICON_MAP)

const slugify = (str) =>
    String(str ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

const nanoId = () => Math.random().toString(36).slice(2, 8)

export default function ServicesPage() {
    const toast = useToast()
    const services = useAsync(() => listServices({ onlyActive: false }), [])
    const [editing, setEditing] = useState(null)
    const [creating, setCreating] = useState(false)
    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const confirmDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await deleteService(toDelete.id)
            toast.success('Serviço removido.')
            setToDelete(null)
            services.refetch()
        } catch (e) {
            toast.error(e.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Catálogo"
                title="Serviços oferecidos"
                subtitle="Configure o catálogo que aparece no agendamento. Ative, desative ou adicione variantes (ex.: tipos de vacina dentro de 'Vacinação')."
                actions={<Button icon={Plus} onClick={() => setCreating(true)}>Novo serviço</Button>}
            />

            {services.loading && <SkeletonRows rows={3} height={70} />}

            <div>
                {(services.data ?? []).map(s => {
                    const Icon = ICON_MAP[s.icon] ?? Sparkles
                    const optCount = Array.isArray(s.options) ? s.options.length : 0
                    return (
                        <div key={s.id} className="service-row">
                            <div><Icon size={22} /></div>
                            <div>
                                <strong>{s.name}</strong>
                                <span>{s.description}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                <small>{s.duration} min</small>
                                {s.price != null && <small>{formatBRL(s.price)}</small>}
                                {optCount > 0 && <Badge tone="info">{optCount} {optCount === 1 ? 'variante' : 'variantes'}</Badge>}
                                {!s.active && <Badge tone="muted">Inativo</Badge>}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button variant="outline" size="sm" icon={Edit3} onClick={() => setEditing(s)}>Editar</Button>
                                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setToDelete(s)} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <ServiceModal
                open={!!editing || creating}
                onClose={() => { setEditing(null); setCreating(false); }}
                initial={editing ?? null}
                onSaved={() => {
                    setEditing(null); setCreating(false);
                    services.refetch();
                    toast.success('Catálogo atualizado.')
                }}
            />

            <ConfirmDialog
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={confirmDelete}
                title="Remover serviço?"
                description={toDelete ? `"${toDelete.name}" não poderá mais ser selecionado pelos tutores. Agendamentos antigos mantêm o nome do serviço.` : ''}
                loading={deleting}
            />
        </>
    )
}

const emptyForm = () => ({
    id: '', name: '', description: '', icon: 'Stethoscope',
    duration: 30, price: '', active: true, options: [],
})

function ServiceModal({ open, onClose, initial, onSaved }) {
    const toast = useToast()
    const [form, setForm] = useState(emptyForm())
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        if (initial) {
            setForm({
                id:          initial.id,
                name:        initial.name ?? '',
                description: initial.description ?? '',
                icon:        initial.icon ?? 'Stethoscope',
                duration:    initial.duration ?? 30,
                price:       initial.price ?? '',
                active:      initial.active !== false,
                options:     Array.isArray(initial.options) ? initial.options : [],
            })
        } else {
            setForm(emptyForm())
        }
    }, [open, initial])

    const set = (k) => (e) => {
        const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm(prev => ({ ...prev, [k]: v }))
    }

    const submit = async (e) => {
        e?.preventDefault?.()
        if (!form.name.trim()) return toast.error('Dê um nome ao serviço.')

        const finalId = initial
            ? initial.id
            : (form.id.trim() || slugify(form.name))

        if (!finalId) return toast.error('Não foi possível gerar um identificador. Ajuste o nome.')

        setSaving(true)
        try {
            await upsertService({
                id:          finalId,
                name:        form.name.trim(),
                description: form.description.trim() || null,
                icon:        form.icon,
                duration:    Number(form.duration) || 30,
                price:       form.price === '' || form.price == null ? null : Number(form.price),
                active:      form.active !== false,
                options:     (form.options ?? []).filter(o => (o?.name ?? '').trim() !== ''),
            })
            onSaved?.()
        } catch (err) {
            if (err.code === 'OPTIONS_COLUMN_MISSING') {
                // Serviço foi salvo, mas sem variantes — avisa e fecha
                toast.error(err.message)
                onSaved?.()
            } else {
                toast.error(err.message)
            }
        } finally {
            setSaving(false)
        }
    }

    // ── opções helpers
    const addOption = () =>
        setForm(prev => ({
            ...prev,
            options: [...(prev.options ?? []), { id: nanoId(), name: '', price: '' }],
        }))
    const updateOption = (idx, patch) =>
        setForm(prev => ({
            ...prev,
            options: prev.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
        }))
    const removeOption = (idx) =>
        setForm(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== idx),
        }))

    return (
        <Modal
            open={open}
            onClose={saving ? undefined : onClose}
            title={initial ? `Editar "${initial.name}"` : 'Novo serviço'}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} icon={Save} loading={saving}>Salvar</Button>
                </>
            }
        >
            <form onSubmit={submit} className="svc-form">
                {/* ── Bloco principal ── */}
                <FormField label="Nome do serviço" required>
                    <input
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Ex.: Consulta Clínica, Vacinação, Banho e tosa..."
                        required
                        autoFocus={!initial}
                    />
                </FormField>

                <FormField label="Descrição" hint="Texto curto que aparece na tela de agendamento para o tutor.">
                    <textarea
                        rows={2}
                        value={form.description}
                        onChange={set('description')}
                        placeholder="Ex.: Avaliação clínica geral e orientação."
                    />
                </FormField>

                <FormField label="Ícone" hint="Aparece no card do serviço para o tutor.">
                    <div className="svc-icon-grid">
                        {ICON_LIST.map(key => {
                            const IconComp = ICON_MAP[key]
                            const selected = form.icon === key
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={`svc-icon-btn ${selected ? 'is-selected' : ''}`}
                                    onClick={() => setForm(prev => ({ ...prev, icon: key }))}
                                    aria-label={key}
                                    aria-pressed={selected}
                                    title={key}
                                >
                                    <IconComp size={20} />
                                    {selected && <span className="svc-icon-check"><Check size={10} /></span>}
                                </button>
                            )
                        })}
                    </div>
                </FormField>

                <div className="svc-form-row">
                    <FormField label="Duração" icon={Clock} suffix="min">
                        <input type="number" min="5" step="5" value={form.duration} onChange={set('duration')} />
                    </FormField>
                    <FormField label="Preço base" icon={CircleDollarSign} suffix="R$">
                        <input type="number" min="0" step="0.01" value={form.price ?? ''} onChange={set('price')} placeholder="0,00" />
                    </FormField>
                </div>

                <label className="svc-toggle">
                    <input type="checkbox" checked={!!form.active} onChange={set('active')} />
                    <span className="svc-toggle-track"><span className="svc-toggle-thumb" /></span>
                    <span className="svc-toggle-label">Disponível para agendamento pelos tutores</span>
                </label>

                {/* ── Variantes ── */}
                <div className="svc-options">
                    <div className="svc-options-header">
                        <div>
                            <strong>Variantes deste serviço</strong>
                            <p>Use para serviços que têm sub-tipos (ex.: Vacinação → V8, V10, Antirrábica...). Deixe vazio se não aplica.</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addOption}>
                            Adicionar variante
                        </Button>
                    </div>

                    {(form.options ?? []).length === 0 ? (
                        <div className="svc-options-empty">
                            Nenhuma variante. Exemplo: para "Vacinação", adicione V8, V10, Antirrábica, etc.
                        </div>
                    ) : (
                        <div className="svc-options-list">
                            {form.options.map((opt, idx) => (
                                <div key={opt.id ?? idx} className="svc-option-row">
                                    <input
                                        value={opt.name ?? ''}
                                        onChange={(e) => updateOption(idx, { name: e.target.value })}
                                        placeholder="Nome da variante (ex.: V10)"
                                        className="svc-option-name"
                                    />
                                    <div className="svc-option-price">
                                        <em>R$</em>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={opt.price ?? ''}
                                            onChange={(e) => updateOption(idx, { price: e.target.value })}
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="svc-option-remove"
                                        onClick={() => removeOption(idx)}
                                        aria-label="Remover variante"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    )
}
