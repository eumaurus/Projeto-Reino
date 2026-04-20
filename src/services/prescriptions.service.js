import { supabase } from './supabase'

const rowToPrescription = (r) => ({
    id:             r.id,
    petId:          r.pet_id,
    ownerId:        r.owner_id,
    vetId:          r.vet_id,
    consultationId: r.consultation_id,
    items:          r.items ?? [],
    instructions:   r.instructions,
    issuedAt:       r.issued_at,
    validUntil:     r.valid_until,
    createdAt:      r.created_at,
    vet:            r.vet ?? null,
})

export const createPrescription = async (p) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .insert({
            pet_id:          p.petId,
            owner_id:        p.ownerId,
            vet_id:          p.vetId ?? null,
            consultation_id: p.consultationId ?? null,
            items:           p.items ?? [],
            instructions:    p.instructions ?? null,
            valid_until:     p.validUntil ?? null,
        })
        .select()
        .single()
    if (error) throw error
    return rowToPrescription(data)
}

export const getPrescriptionById = async (id) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('id', id)
        .maybeSingle()
    if (error) throw error
    return data ? rowToPrescription(data) : null
}

export const updatePrescription = async (id, fields) => {
    const payload = {}
    if (fields.items        !== undefined) payload.items        = fields.items
    if (fields.instructions !== undefined) payload.instructions = fields.instructions
    if (fields.validUntil   !== undefined) payload.valid_until  = fields.validUntil
    const { error } = await supabase
        .from('prescriptions')
        .update(payload)
        .eq('id', id)
    if (error) throw error
}

export const listPrescriptionsByPet = async (petId) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('pet_id', petId)
        .order('issued_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToPrescription)
}
