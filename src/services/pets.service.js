import { supabase } from './supabase'

const rowToPet = (row) => ({
    id:           row.id,
    ownerId:      row.owner_id,
    name:         row.name,
    species:      row.species,
    breed:        row.breed,
    age:          row.age,
    weight:       row.weight,
    image:        row.image,
    notes:        row.notes,
    nextVaccine:  row.next_vaccine,
    birthDate:    row.birth_date,
    vaccines:     row.vaccines ?? [],
    createdAt:    row.created_at,
    updatedAt:    row.updated_at,
    owner:        row.profiles ?? null,
})

const petToRow = (pet) => ({
    id:           pet.id,
    owner_id:     pet.ownerId,
    name:         pet.name,
    species:      pet.species,
    breed:        pet.breed ?? null,
    age:          pet.age ?? null,
    weight:       pet.weight ?? null,
    image:        pet.image ?? null,
    notes:        pet.notes ?? null,
    next_vaccine: pet.nextVaccine ?? null,
    birth_date:   pet.birthDate ?? null,
    vaccines:     pet.vaccines ?? [],
})

export const listAllPets = async () => {
    const { data, error } = await supabase
        .from('pets')
        .select('*, profiles:owner_id (id, name, email, phone)')
        .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToPet)
}

export const listPetsByOwner = async (ownerId) => {
    const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToPet)
}

export const getPetById = async (petId) => {
    const { data, error } = await supabase
        .from('pets')
        .select('*, profiles:owner_id (id, name, email, phone)')
        .eq('id', petId)
        .maybeSingle()
    if (error) throw error
    return data ? rowToPet(data) : null
}

export const savePet = async (pet) => {
    const { error } = await supabase
        .from('pets')
        .upsert(petToRow(pet), { onConflict: 'id' })
    if (error) throw error
}

export const deletePet = async (petId) => {
    const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId)
    if (error) throw error
}

export const generatePetCode = () => String(Math.floor(10000 + Math.random() * 90000))
