import { supabase } from './supabase'

const sanitize = (name = '') =>
    name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')

const extOf = (file) => {
    const parts = file.name.split('.')
    return parts.length > 1 ? parts.pop().toLowerCase() : 'jpg'
}

export const uploadPetImage = async (file, petId) => {
    const path = `pet-${petId}/${Date.now()}-${sanitize(file.name).slice(0, 40) || 'img'}.${extOf(file)}`
    const { error } = await supabase.storage
        .from('pets')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('pets').getPublicUrl(path)
    return data.publicUrl
}

export const uploadAvatar = async (file, userId) => {
    const path = `user-${userId}/${Date.now()}.${extOf(file)}`
    const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
}

export const uploadExamFile = async (file, petId) => {
    const path = `pet-${petId}/${Date.now()}-${sanitize(file.name).slice(0, 40) || 'file'}.${extOf(file)}`
    const { error } = await supabase.storage
        .from('exams')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
    if (error) throw error
    const { data } = supabase.storage.from('exams').getPublicUrl(path)
    return data.publicUrl
}
