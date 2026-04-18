import { supabase } from './supabase'

export const listServices = async ({ onlyActive = true } = {}) => {
    let q = supabase.from('services').select('*').order('sort_order', { ascending: true })
    if (onlyActive) q = q.eq('active', true)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
}

export const upsertService = async (svc) => {
    const { error } = await supabase.from('services').upsert({
        id:          svc.id,
        name:        svc.name,
        description: svc.description ?? null,
        icon:        svc.icon ?? null,
        duration:    svc.duration ?? 30,
        price:       svc.price ?? null,
        active:      svc.active !== false,
        sort_order:  svc.sortOrder ?? 0,
    }, { onConflict: 'id' })
    if (error) throw error
}

export const deleteService = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
}
