import { supabase } from './supabase'

const rowToBooking = (r) => ({
    id:             r.id,
    ownerId:        r.owner_id,
    petId:          r.pet_id,
    service:        r.service,
    vaccines:       r.vaccines ?? [],
    requestedDate:  r.requested_date,
    requestedTime:  r.requested_time,
    status:         r.status,
    notes:          r.notes,
    confirmedBy:    r.confirmed_by,
    confirmedAt:    r.confirmed_at,
    cancelledReason:r.cancelled_reason,
    durationMinutes:r.duration_minutes,
    createdAt:      r.created_at,
    pet:            r.pets ?? null,
    owner:          r.profiles ?? null,
})

export const createBooking = async ({ ownerId, petId, service, vaccines, requestedDate, requestedTime, notes }) => {
    const { data, error } = await supabase
        .from('bookings')
        .insert({
            owner_id:       ownerId,
            pet_id:         petId,
            service,
            vaccines:       vaccines ?? [],
            requested_date: requestedDate,
            requested_time: requestedTime,
            notes:          notes ?? null,
        })
        .select()
        .single()
    if (error) throw error
    return rowToBooking(data)
}

export const listBookingsByOwner = async (ownerId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*, pets:pet_id (id, name, species, image)')
        .eq('owner_id', ownerId)
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToBooking)
}

export const listAllBookings = async ({ from, to, status } = {}) => {
    let query = supabase
        .from('bookings')
        .select('*, pets:pet_id (id, name, species, image), profiles:owner_id (id, name, phone, email)')
        .order('requested_date', { ascending: true })
        .order('requested_time', { ascending: true })

    if (from)   query = query.gte('requested_date', from)
    if (to)     query = query.lte('requested_date', to)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(rowToBooking)
}

export const updateBookingStatus = async (bookingId, status, extras = {}) => {
    const payload = { status, ...extras }
    if (status === 'confirmed') {
        payload.confirmed_at = new Date().toISOString()
        const { data: userRes } = await supabase.auth.getUser()
        if (userRes?.user?.id) payload.confirmed_by = userRes.user.id
    }
    const { error } = await supabase
        .from('bookings')
        .update(payload)
        .eq('id', bookingId)
    if (error) throw error
}

export const cancelBookingByOwner = async (bookingId, reason = null) => {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_reason: reason })
        .eq('id', bookingId)
    if (error) throw error
}

export const deleteBooking = async (bookingId) => {
    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
    if (error) throw error
}

export const getBookingStats = async () => {
    const { data, error } = await supabase
        .from('bookings')
        .select('id, status, requested_date, service')
    if (error) throw error
    const rows = data ?? []
    const today = new Date().toISOString().slice(0, 10)
    const inSevenDays = new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10)
    return {
        total:     rows.length,
        pending:   rows.filter(r => r.status === 'pending').length,
        confirmed: rows.filter(r => r.status === 'confirmed').length,
        done:      rows.filter(r => r.status === 'done').length,
        cancelled: rows.filter(r => r.status === 'cancelled').length,
        today:     rows.filter(r => r.requested_date === today).length,
        next7:     rows.filter(r => r.requested_date >= today && r.requested_date <= inSevenDays).length,
    }
}
