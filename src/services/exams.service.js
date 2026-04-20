import { supabase } from './supabase'

const rowToExam = (r) => ({
    id:             r.id,
    petId:          r.pet_id,
    ownerId:        r.owner_id,
    vetId:          r.vet_id,
    consultationId: r.consultation_id,
    type:           r.type,
    category:       r.category,
    status:         r.status,
    requestedAt:    r.requested_at,
    completedAt:    r.completed_at,
    results:        r.results,
    conclusion:     r.conclusion,
    fileUrl:        r.file_url,
    createdAt:      r.created_at,
    vet:            r.vet ?? null,
})

export const createExam = async (e) => {
    const { data, error } = await supabase
        .from('exams')
        .insert({
            pet_id:          e.petId,
            owner_id:        e.ownerId,
            vet_id:          e.vetId ?? null,
            consultation_id: e.consultationId ?? null,
            type:            e.type,
            category:        e.category ?? 'laboratorial',
            status:          e.status ?? 'requested',
            results:         e.results ?? null,
            conclusion:      e.conclusion ?? null,
            file_url:        e.fileUrl ?? null,
        })
        .select()
        .single()
    if (error) throw error
    return rowToExam(data)
}

export const getExamById = async (id) => {
    const { data, error } = await supabase
        .from('exams')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('id', id)
        .maybeSingle()
    if (error) throw error
    return data ? rowToExam(data) : null
}

export const updateExam = async (id, fields) => {
    const payload = { ...fields }
    if (payload.status === 'completed' && !payload.completed_at) {
        payload.completed_at = new Date().toISOString()
    }
    const { error } = await supabase
        .from('exams')
        .update(payload)
        .eq('id', id)
    if (error) throw error
}

export const listExamsByPet = async (petId) => {
    const { data, error } = await supabase
        .from('exams')
        .select('*, vet:vet_id (id, name, crmv)')
        .eq('pet_id', petId)
        .order('requested_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToExam)
}

export const listPendingExams = async () => {
    const { data, error } = await supabase
        .from('exams')
        .select('*, pets:pet_id (id, name, species), profiles:owner_id (id, name, phone)')
        .in('status', ['requested', 'in_progress'])
        .order('requested_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToExam)
}
