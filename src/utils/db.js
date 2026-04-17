import { supabase } from './supabaseClient'

// ─── helpers ────────────────────────────────────────────────────────────────

const normalizeDoc = (doc) => doc.replace(/\D/g, '')

function dbRowToPet(row) {
    return {
        id:                   row.id,
        ownerId:              row.owner_id,
        name:                 row.name,
        species:              row.species,
        breed:                row.breed,
        age:                  row.age,
        weight:               row.weight,
        image:                row.image,
        notes:                row.notes,
        nextVaccine:          row.next_vaccine,
        birthDate:            row.birth_date,
        upcomingAppointments: row.upcoming_appointments ?? [],
        vaccines:             row.vaccines ?? [],
    }
}

function petToDbRow(pet) {
    return {
        id:                    pet.id,
        owner_id:              pet.ownerId,
        name:                  pet.name,
        species:               pet.species,
        breed:                 pet.breed ?? null,
        age:                   pet.age ?? null,
        weight:                pet.weight ?? null,
        image:                 pet.image ?? null,
        notes:                 pet.notes ?? null,
        next_vaccine:          pet.nextVaccine ?? null,
        birth_date:            pet.birthDate ?? null,
        upcoming_appointments: pet.upcomingAppointments ?? [],
        vaccines:              pet.vaccines ?? [],
    }
}

// ─── USERS ──────────────────────────────────────────────────────────────────

export const getDbUsers = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
}

// ─── PETS ────────────────────────────────────────────────────────────────────

export const getDbPets = async () => {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(dbRowToPet)
}

export const getPetsByOwnerId = async (ownerId) => {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(dbRowToPet)
}

export const getPetById = async (petId) => {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .maybeSingle()

    if (error) throw error
    return data ? dbRowToPet(data) : null
}

export const savePet = async (pet) => {
    const row = petToDbRow(pet)
    const { error } = await supabase
        .from('pets')
        .upsert(row, { onConflict: 'id' })

    if (error) throw error
    return { success: true }
}

// ─── AUTH / USERS ────────────────────────────────────────────────────────────

export const registerUser = async ({ name, document, email, phone, password }) => {
    const normalDoc = normalizeDoc(document)

    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('document', normalDoc)
        .maybeSingle()

    if (existing) {
        return { success: false, message: 'Este CPF/CNPJ já está cadastrado.' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name, document: normalDoc, phone, role: 'client' }
        }
    })

    if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
            return { success: false, message: 'Este e-mail já está em uso.' }
        }
        return { success: false, message: error.message }
    }

    return { success: true, user: data.user }
}

export const deleteUser = async (userId) => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

    if (error) throw error
    return { success: true }
}

export const updateUserPassword = async (_userId, newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, message: error.message }
    return { success: true }
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

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
    return data
}

export const getBookingsByOwner = async (ownerId) => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*, pets(name, species)')
        .eq('owner_id', ownerId)
        .order('requested_date', { ascending: true })

    if (error) throw error
    return data ?? []
}
