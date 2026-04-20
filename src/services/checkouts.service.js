import { supabase } from './supabase'

const PET_SELECT   = 'pet:pet_id (id, name, species, image)'
const OWNER_SELECT = 'owner:owner_id (id, name, phone, email)'
const VET_SELECT   = 'vet:created_by (id, name)'

const rowToCheckout = (r) => ({
    id:             r.id,
    petId:          r.pet_id,
    ownerId:        r.owner_id,
    consultationId: r.consultation_id,
    bookingId:      r.booking_id,
    createdBy:      r.created_by,
    settledBy:      r.settled_by,
    items:          Array.isArray(r.items) ? r.items : [],
    subtotal:       Number(r.subtotal) || 0,
    discountType:   r.discount_type,
    discountValue:  Number(r.discount_value) || 0,
    total:          Number(r.total) || 0,
    paymentMethod:  r.payment_method,
    status:         r.status,
    notes:          r.notes,
    settledAt:      r.settled_at,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
    pet:            r.pet   ?? null,
    owner:          r.owner ?? null,
    vet:            r.vet   ?? null,
})

const sanitizeItems = (items = []) =>
    items
        .filter(it => it && (it.name ?? '').trim() !== '')
        .map(it => {
            const qty       = Math.max(1, Number(it.qty) || 1)
            const unitPrice = Math.max(0, Number(it.unitPrice) || 0)
            return {
                service_id: it.serviceId ?? null,
                name:       String(it.name).trim(),
                qty,
                unit_price: unitPrice,
                subtotal:   Number((qty * unitPrice).toFixed(2)),
            }
        })

export const computeTotals = ({ items = [], discountType = 'none', discountValue = 0 }) => {
    const clean = sanitizeItems(items)
    const subtotal = clean.reduce((acc, it) => acc + it.subtotal, 0)
    const dv = Math.max(0, Number(discountValue) || 0)
    let discountAmount = 0
    if (discountType === 'value')   discountAmount = Math.min(dv, subtotal)
    if (discountType === 'percent') discountAmount = Math.min(subtotal, subtotal * (dv / 100))
    const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)))
    return {
        items: clean,
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        total,
    }
}

export const createCheckout = async (payload) => {
    const totals = computeTotals(payload)
    if (totals.items.length === 0) {
        throw new Error('Adicione ao menos um item à comanda.')
    }

    const { data: userRes } = await supabase.auth.getUser()
    const createdBy = userRes?.user?.id ?? null

    const { data, error } = await supabase
        .from('checkouts')
        .insert({
            pet_id:          payload.petId,
            owner_id:        payload.ownerId,
            consultation_id: payload.consultationId ?? null,
            booking_id:      payload.bookingId      ?? null,
            created_by:      createdBy,
            items:           totals.items,
            subtotal:        totals.subtotal,
            discount_type:   payload.discountType  ?? 'none',
            discount_value:  Number(payload.discountValue) || 0,
            total:           totals.total,
            notes:           payload.notes ?? null,
            status:          'pending',
        })
        .select()
        .single()
    if (error) throw error
    return rowToCheckout(data)
}

export const listCheckouts = async ({ status, from, to } = {}) => {
    let q = supabase
        .from('checkouts')
        .select(`*, ${PET_SELECT}, ${OWNER_SELECT}, ${VET_SELECT}`)
        .order('created_at', { ascending: false })

    if (status) q = q.eq('status', status)
    if (from)   q = q.gte('created_at', `${from}T00:00:00`)
    if (to)     q = q.lte('created_at', `${to}T23:59:59`)

    const { data, error } = await q
    if (error) throw error
    return (data ?? []).map(rowToCheckout)
}

export const listMyCheckouts = async () => {
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes?.user) return []
    const { data, error } = await supabase
        .from('checkouts')
        .select(`*, ${PET_SELECT}, ${VET_SELECT}`)
        .eq('owner_id', userRes.user.id)
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToCheckout)
}

export const listCheckoutsByBooking = async (bookingIds = []) => {
    if (!bookingIds.length) return []
    const { data, error } = await supabase
        .from('checkouts')
        .select('id, booking_id, status, total')
        .in('booking_id', bookingIds)
    if (error) throw error
    return data ?? []
}

export const markCheckoutPaid = async (id, paymentMethod = null) => {
    const { data: userRes } = await supabase.auth.getUser()
    const { error } = await supabase
        .from('checkouts')
        .update({
            status:         'paid',
            settled_at:     new Date().toISOString(),
            settled_by:     userRes?.user?.id ?? null,
            payment_method: paymentMethod,
        })
        .eq('id', id)
    if (error) throw error
}

export const cancelCheckout = async (id, reason = null) => {
    const { error } = await supabase
        .from('checkouts')
        .update({ status: 'cancelled', notes: reason })
        .eq('id', id)
    if (error) throw error
}

export const updateCheckoutItems = async (id, payload) => {
    const totals = computeTotals(payload)
    const { error } = await supabase
        .from('checkouts')
        .update({
            items:          totals.items,
            subtotal:       totals.subtotal,
            discount_type:  payload.discountType ?? 'none',
            discount_value: Number(payload.discountValue) || 0,
            total:          totals.total,
            notes:          payload.notes ?? null,
        })
        .eq('id', id)
    if (error) throw error
}

export const getCheckoutStats = async ({ from, to } = {}) => {
    let q = supabase.from('checkouts').select('status, total, settled_at, created_at')
    if (from) q = q.gte('created_at', `${from}T00:00:00`)
    if (to)   q = q.lte('created_at', `${to}T23:59:59`)
    const { data, error } = await q
    if (error) throw error
    const rows = data ?? []
    return {
        pending:       rows.filter(r => r.status === 'pending').length,
        paid:          rows.filter(r => r.status === 'paid').length,
        cancelled:     rows.filter(r => r.status === 'cancelled').length,
        pendingAmount: rows.filter(r => r.status === 'pending').reduce((a, r) => a + Number(r.total || 0), 0),
        paidAmount:    rows.filter(r => r.status === 'paid').reduce((a, r) => a + Number(r.total || 0), 0),
        total:         rows.length,
    }
}
