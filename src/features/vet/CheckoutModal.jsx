import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Send, Tag, Briefcase, Receipt, ShoppingBag } from 'lucide-react'
import Modal from '../../shared/components/ui/Modal'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import { useToast } from '../../shared/components/ui/Toast'
import { listServices } from '../../services/catalog.service'
import { createCheckout, computeTotals } from '../../services/checkouts.service'
import { formatBRL } from '../../shared/utils/formatters'
import './checkout.css'

const PRESET_PERCENTS = [5, 10, 15, 20]

const emptyCustomItem = () => ({
    serviceId: null,
    name:      '',
    qty:       1,
    unitPrice: 0,
})

export default function CheckoutModal({
    open,
    onClose,
    pet,
    consultationId = null,
    bookingId      = null,
    seedItems      = [],
    onSent,
}) {
    const toast = useToast()
    const [services, setServices] = useState([])
    const [items, setItems]       = useState([])
    const [discountType, setDiscountType]   = useState('none')
    const [discountValue, setDiscountValue] = useState('')
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        listServices({ onlyActive: true }).then(setServices).catch(() => setServices([]))
    }, [open])

    useEffect(() => {
        if (!open) return
        setItems(seedItems.length ? seedItems.map(it => ({ ...emptyCustomItem(), ...it })) : [])
        setDiscountType('none')
        setDiscountValue('')
        setNotes('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    const totals = useMemo(
        () => computeTotals({ items, discountType, discountValue: Number(discountValue) || 0 }),
        [items, discountType, discountValue],
    )

    // Value format: "serviceId" for services without options, "serviceId|optionId" for a variant.
    const addFromCatalog = (compositeValue) => {
        if (!compositeValue) return
        const [serviceId, optionId] = compositeValue.split('|')
        const svc = services.find(s => s.id === serviceId)
        if (!svc) return

        if (optionId) {
            const opt = (svc.options ?? []).find(o => o.id === optionId)
            if (!opt) return
            setItems(prev => [...prev, {
                serviceId: svc.id,
                name:      `${svc.name} — ${opt.name}`,
                qty:       1,
                unitPrice: Number(opt.price) || 0,
            }])
            return
        }

        setItems(prev => [...prev, {
            serviceId: svc.id,
            name:      svc.name,
            qty:       1,
            unitPrice: Number(svc.price) || 0,
        }])
    }

    const addCustom = () =>
        setItems(prev => [...prev, emptyCustomItem()])

    const removeItem = (idx) =>
        setItems(prev => prev.filter((_, i) => i !== idx))

    const updateItem = (idx, patch) =>
        setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

    const applyPercentPreset = (pct) => {
        setDiscountType('percent')
        setDiscountValue(String(pct))
    }
    const clearDiscount = () => {
        setDiscountType('none')
        setDiscountValue('')
    }
    const switchToCustomValue = () => {
        setDiscountType('value')
        setDiscountValue('')
    }
    const switchToCustomPercent = () => {
        setDiscountType('percent')
        setDiscountValue('')
    }

    const submit = async () => {
        if (totals.items.length === 0) {
            return toast.error('Adicione ao menos um item à comanda.')
        }
        setSaving(true)
        try {
            await createCheckout({
                petId:          pet.id,
                ownerId:        pet.ownerId,
                consultationId,
                bookingId,
                items,
                discountType,
                discountValue,
                notes,
            })
            toast.success('Comanda enviada para a recepção!')
            onSent?.()
            onClose?.()
        } catch (err) {
            toast.error(err.message ?? 'Falha ao enviar comanda.')
        } finally {
            setSaving(false)
        }
    }

    const isPercentPreset = discountType === 'percent' && PRESET_PERCENTS.includes(Number(discountValue))
    const showCustomInput = (discountType === 'value') || (discountType === 'percent' && !isPercentPreset)

    return (
        <Modal
            open={open}
            onClose={saving ? undefined : onClose}
            size="lg"
            title="Enviar comanda para a recepção"
            description={pet ? `Pet: ${pet.name} · Tutor: ${pet.owner?.name ?? '—'}` : ''}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
                    <Button icon={Send} onClick={submit} loading={saving} disabled={totals.items.length === 0}>
                        Enviar · {formatBRL(totals.total)}
                    </Button>
                </>
            }
        >
            {/* ─── Lista de itens ─── */}
            <div className="cx-items">
                {items.length === 0 && (
                    <div className="cx-empty">
                        <ShoppingBag size={28} />
                        <strong>Nenhum item na comanda</strong>
                        <span>Adicione do catálogo ou crie um item avulso abaixo.</span>
                    </div>
                )}

                {items.map((it, idx) => {
                    const lineSubtotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0)
                    const isCatalog = !!it.serviceId
                    return (
                        <article
                            key={idx}
                            className={`cx-item ${isCatalog ? 'is-catalog' : 'is-custom'}`}
                        >
                            <header className="cx-item-head">
                                <span className={`cx-item-kind ${isCatalog ? 'kind-catalog' : 'kind-custom'}`}>
                                    {isCatalog
                                        ? <><Briefcase size={11} /> Catálogo</>
                                        : <><Tag size={11} /> Avulso</>}
                                </span>
                                <button
                                    type="button"
                                    className="cx-remove"
                                    onClick={() => removeItem(idx)}
                                    aria-label="Remover item"
                                    title="Remover item"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </header>

                            <div className="cx-item-name">
                                {isCatalog ? (
                                    <strong>{it.name}</strong>
                                ) : (
                                    <input
                                        value={it.name}
                                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                                        placeholder="Descrição (ex.: Vacina V10, curativo...)"
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div className="cx-item-fields">
                                <label className="cx-field">
                                    <span>Qtd</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={it.qty}
                                        onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                                    />
                                </label>
                                <label className="cx-field">
                                    <span>Preço unitário</span>
                                    <div className="cx-price-input">
                                        <em>R$</em>
                                        <input
                                            type="number"
                                            min={0}
                                            step="0.01"
                                            value={it.unitPrice}
                                            onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                                        />
                                    </div>
                                </label>
                                <div className="cx-line-subtotal">
                                    <span>Subtotal</span>
                                    <strong>{formatBRL(lineSubtotal)}</strong>
                                </div>
                            </div>
                        </article>
                    )
                })}
            </div>

            {/* ─── Botões de adicionar ─── */}
            <div className="cx-add-bar">
                <div className="cx-add-catalog-wrap">
                    <select
                        className="cx-add-catalog"
                        value=""
                        onChange={(e) => addFromCatalog(e.target.value)}
                    >
                        <option value="">+ Adicionar do catálogo…</option>
                        {services.map(s => {
                            const opts = Array.isArray(s.options) ? s.options : []
                            if (opts.length === 0) {
                                return (
                                    <option key={s.id} value={s.id}>
                                        {s.name}{s.price ? ` — ${formatBRL(s.price)}` : ''}
                                    </option>
                                )
                            }
                            return (
                                <optgroup key={s.id} label={s.name}>
                                    {opts.map(opt => (
                                        <option key={opt.id} value={`${s.id}|${opt.id}`}>
                                            {opt.name}{opt.price ? ` — ${formatBRL(opt.price)}` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )
                        })}
                    </select>
                </div>
                <Button variant="outline" icon={Plus} onClick={addCustom}>
                    Item avulso
                </Button>
            </div>

            {/* ─── Desconto com presets ─── */}
            <div className="cx-discount">
                <div className="cx-discount-label">
                    <Tag size={14} /> Desconto
                </div>
                <div className="cx-chips">
                    <button
                        type="button"
                        className={`cx-chip ${discountType === 'none' ? 'is-active' : ''}`}
                        onClick={clearDiscount}
                    >
                        Sem desconto
                    </button>
                    {PRESET_PERCENTS.map(pct => (
                        <button
                            key={pct}
                            type="button"
                            className={`cx-chip ${discountType === 'percent' && Number(discountValue) === pct ? 'is-active' : ''}`}
                            onClick={() => applyPercentPreset(pct)}
                        >
                            {pct}%
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`cx-chip ${discountType === 'percent' && !isPercentPreset ? 'is-active' : ''}`}
                        onClick={switchToCustomPercent}
                    >
                        % custom
                    </button>
                    <button
                        type="button"
                        className={`cx-chip ${discountType === 'value' ? 'is-active' : ''}`}
                        onClick={switchToCustomValue}
                    >
                        R$ custom
                    </button>
                </div>
                {showCustomInput && (
                    <div className="cx-discount-custom">
                        <span className="cx-discount-custom-prefix">
                            {discountType === 'percent' ? '%' : 'R$'}
                        </span>
                        <input
                            type="number"
                            min={0}
                            step={discountType === 'percent' ? 0.1 : 0.01}
                            max={discountType === 'percent' ? 100 : undefined}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'percent' ? 'Ex.: 12,5' : 'Ex.: 50,00'}
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* ─── Resumo ─── */}
            <div className="cx-summary-new">
                <div className="cx-summary-line">
                    <span>Subtotal</span>
                    <span>{formatBRL(totals.subtotal)}</span>
                </div>
                {totals.discountAmount > 0 && (
                    <div className="cx-summary-line is-discount">
                        <span>Desconto aplicado</span>
                        <span>− {formatBRL(totals.discountAmount)}</span>
                    </div>
                )}
                <div className="cx-summary-total-new">
                    <span><Receipt size={15} /> Total a cobrar</span>
                    <strong>{formatBRL(totals.total)}</strong>
                </div>
            </div>

            <FormField label="Observações para a recepção (opcional)">
                <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex.: cliente vai pagar em 2x, retorno gratuito em 15 dias..."
                />
            </FormField>
        </Modal>
    )
}
