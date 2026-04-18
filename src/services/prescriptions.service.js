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

export const listPrescriptionsByPet = async (petId) => {
    const { data, error } = await supabase
        .from('prescriptions')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('pet_id', petId)
        .order('issued_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToPrescription)
}
