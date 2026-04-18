import { supabase } from './supabase'

export const listProfiles = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
    if (error) throw error
    return data ?? []
}

export const listStaff = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'vet'])
        .order('name')
    if (error) throw error
    return data ?? []
}

export const listClients = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('name')
    if (error) throw error
    return data ?? []
}

export const getProfile = async (id) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    if (error) throw error
    return data
}

export const searchProfiles = async (term, role = null) => {
    const query = supabase.from('profiles').select('*').order('name')
    if (role) query.eq('role', role)

    const needle = (term ?? '').trim()
    if (needle) {
        const cleanDoc = needle.replace(/\D/g, '')
        if (cleanDoc && cleanDoc.length >= 3) {
            query.or(`name.ilike.%${needle}%,document.ilike.%${cleanDoc}%,email.ilike.%${needle}%`)
        } else {
            query.or(`name.ilike.%${needle}%,email.ilike.%${needle}%`)
        }
    }

    const { data, error } = await query.limit(50)
    if (error) throw error
    return data ?? []
}

export const updateProfile = async (id, fields) => {
    const { error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', id)
    if (error) throw error
}

export const deleteProfile = async (id) => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
    if (error) throw error
}
