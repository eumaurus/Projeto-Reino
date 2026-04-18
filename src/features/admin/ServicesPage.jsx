import { useState } from 'react'
import {
    Briefcase, Plus, Trash2, Edit3, Stethoscope, Syringe, Microscope,
    Scissors, Droplets, Home, ActivitySquare, Sparkles, Save,
} from 'lucide-react'
import { useAsync } from '../../shared/hooks/useAsync'
import { listServices, upsertService, deleteService } from '../../services/catalog.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import Modal from '../../shared/components/ui/Modal'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import ConfirmDialog from '../../shared/components/ui/ConfirmDialog'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Badge from '../../shared/components/ui/Badge'
import { useToast } from '../../shared/components/ui/Toast'
import { formatBRL } from '../../shared/utils/formatters'

const ICON_MAP = {
    Stethoscope, Syringe, Microscope, Scissors, Droplets, Home, ActivitySquare, Sparkles, Briefcase,
}
const ICON_OPTIONS = Object.keys(ICON_MAP).map(k => ({ value: k, label: k }))

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
                subtitle="Configure o catálogo que aparece na tela de agendamento. Ative, desative ou crie novos serviços."
                actions={<Button icon={Plus} onClick={() => setCreating(true)}>Novo serviço</Button>}
            />

            {services.loading && <SkeletonRows rows={3} height={70} />}

            <div>
                {(services.data ?? []).map(s => {
                    const Icon = ICON_MAP[s.icon] ?? Sparkles
                    return (
                        <div key={s.id} className="service-row">
                            <div><Icon size={22} /></div>
                            <div>
                                <strong>{s.name}</strong>
                                <span>{s.description}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                <small>{s.duration} min</small>
                                <small>{formatBRL(s.price)}</small>
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

function ServiceModal({ open, onClose, initial, onSaved }) {
    const toast = useToast()
    const [form, setForm] = useState(initial ?? {
        id: '', name: '', description: '', icon: 'Stethoscope', duration: 30, price: '', sortOrder: 0, active: true,
    })
    const [saving, setSaving] = useState(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (open && initial && form.id !== initial.id) setForm(initial)
    if (open && !initial && form.id && !form.name) {
        setForm({ id: '', name: '', description: '', icon: 'Stethoscope', duration: 30, price: '', sortOrder: 0, active: true })
    }

    const set = (k) => (e) => {
        const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
        setForm(prev => ({ ...prev, [k]: v }))
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!form.id.trim() || !form.name.trim()) return toast.error('ID e nome são obrigatórios.')
        setSaving(true)
        try {
            await upsertService({
                id: form.id.trim().toLowerCase(),
                name: form.name.trim(),
                description: form.description.trim() || null,
                icon: form.icon,
                duration: Number(form.duration) || 30,
                price: form.price ? Number(form.price) : null,
                sortOrder: Number(form.sortOrder) || 0,
                active: form.active !== false,
            })
            onSaved?.()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={initial ? `Editar "${initial.name}"` : 'Novo serviço'}
            size="md"
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button onClick={submit} icon={Save} loading={saving}>Salvar</Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="ID (slug)" hint="Ex.: consulta. Não altere após criar.">
                    <input value={form.id} onChange={set('id')} disabled={!!initial} required />
                </FormField>
                <FormField label="Nome">
                    <input value={form.name} onChange={set('name')} required />
                </FormField>
                <FormField label="Descrição" >
                    <textarea rows={2} value={form.description} onChange={set('description')} style={{ gridColumn: '1/-1' }} />
                </FormField>
                <FormField label="Ícone">
                    <SelectInput value={form.icon} onChange={set('icon')} options={ICON_OPTIONS} />
                </FormField>
                <FormField label="Duração (min)">
                    <input type="number" min="5" step="5" value={form.duration} onChange={set('duration')} />
                </FormField>
                <FormField label="Preço (R$)">
                    <input type="number" min="0" step="0.01" value={form.price ?? ''} onChange={set('price')} />
                </FormField>
                <FormField label="Ordem">
                    <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
                </FormField>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={!!form.active} onChange={set('active')} /> Disponível para agendamento
                </label>
            </form>
        </Modal>
    )
}
