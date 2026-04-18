import { supabase } from './supabase'

const rowToConsultation = (r) => ({
    id:           r.id,
    petId:        r.pet_id,
    ownerId:      r.owner_id,
    vetId:        r.vet_id,
    bookingId:    r.booking_id,
    consultedAt:  r.consulted_at,
    reason:       r.reason,
    anamnesis:    r.anamnesis,
    procedures:   r.procedures,
    diagnosis:    r.diagnosis,
    treatment:    r.treatment,
    notes:        r.notes,
    weightKg:     r.weight_kg,
    temperatureC: r.temperature_c,
    heartRate:    r.heart_rate,
    createdAt:    r.created_at,
    updatedAt:    r.updated_at,
    vet:          r.vet ?? null,
    pet:          r.pets ?? null,
})

const consultationToRow = (c) => ({
    pet_id:        c.petId,
    owner_id:      c.ownerId,
    vet_id:        c.vetId ?? null,
    booking_id:    c.bookingId ?? null,
    consulted_at:  c.consultedAt ?? new Date().toISOString(),
    reason:        c.reason        ?? null,
    anamnesis:     c.anamnesis     ?? null,
    procedures:    c.procedures    ?? null,
    diagnosis:     c.diagnosis     ?? null,
    treatment:     c.treatment     ?? null,
    notes:         c.notes         ?? null,
    weight_kg:     c.weightKg      ?? null,
    temperature_c: c.temperatureC  ?? null,
    heart_rate:    c.heartRate     ?? null,
})

export const createConsultation = async (consultation) => {
    const { data, error } = await supabase
        .from('consultations')
        .insert(consultationToRow(consultation))
        .select()
        .single()
    if (error) throw error
    return rowToConsultation(data)
}

export const updateConsultation = async (id, fields) => {
    const row = consultationToRow(fields)
    delete row.pet_id
    delete row.owner_id
    const { error } = await supabase
        .from('consultations')
        .update(row)
        .eq('id', id)
    if (error) throw error
}

export const listConsultationsByPet = async (petId) => {
    const { data, error } = await supabase
        .from('consultations')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('pet_id', petId)
        .order('consulted_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToConsultation)
}

export const listRecentConsultationsByVet = async (vetId, limit = 10) => {
    const { data, error } = await supabase
        .from('consultations')
        .select('*, pets:pet_id (id, name, species, image)')
        .eq('vet_id', vetId)
        .order('consulted_at', { ascending: false })
        .limit(limit)
    if (error) throw error
    return (data ?? []).map(rowToConsultation)
}

export const countConsultations = async () => {
    const { count, error } = await supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
}
