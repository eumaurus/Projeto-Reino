import { supabase } from './supabase'

export const listServices = async ({ onlyActive = true } = {}) => {
    let q = supabase.from('services').select('*').order('sort_order', { ascending: true })
    if (onlyActive) q = q.eq('active', true)
    const { data, error } = await q
    if (error) throw error
    return data ?? []
}

export const upsertService = async (svc) => {
    const base = {
        id:          svc.id,
        name:        svc.name,
        description: svc.description ?? null,
        icon:        svc.icon ?? null,
        duration:    svc.duration ?? 30,
        price:       svc.price ?? null,
        active:      svc.active !== false,
        sort_order:  svc.sortOrder ?? 0,
    }
    const withOptions = svc.options !== undefined
        ? { ...base, options: Array.isArray(svc.options) ? svc.options : [] }
        : base

    let { error } = await supabase.from('services').upsert(withOptions, { onConflict: 'id' })

    // Retry without `options` if the column doesn't exist yet (migration pending)
    if (error && /options/i.test(error.message) && /column|schema/i.test(error.message)) {
        const retry = await supabase.from('services').upsert(base, { onConflict: 'id' })
        if (retry.error) throw retry.error
        const warn = new Error(
            'Serviço salvo, mas as variantes não foram gravadas: a coluna "options" não existe no banco. Aplique a migration 20260420010000_service_options.sql.'
        )
        warn.code = 'OPTIONS_COLUMN_MISSING'
        throw warn
    }
    if (error) throw error
}

export const deleteService = async (id) => {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
}
