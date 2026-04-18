import { supabase } from './supabase'

const onlyDigits = (v = '') => String(v).replace(/\D/g, '')

export const signUpClient = async ({ name, document, email, phone, password }) => {
    const normalDoc = onlyDigits(document)

    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('document', normalDoc)
        .maybeSingle()

    if (existing) {
        return { ok: false, message: 'Este CPF/CNPJ já está cadastrado.' }
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, document: normalDoc, phone, role: 'client' } },
    })

    if (error) {
        const msg = error.message?.toLowerCase() ?? ''
        if (msg.includes('already registered')) {
            return { ok: false, message: 'Este e-mail já está em uso.' }
        }
        return { ok: false, message: error.message }
    }
    return { ok: true, user: data.user }
}

export const signInWithIdentifier = async (identifier, password) => {
    let email = identifier.trim()

    if (!email.includes('@')) {
        const doc = onlyDigits(email)
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('document', doc)
            .maybeSingle()

        if (!profile?.email) {
            return { ok: false, message: 'CPF/CNPJ não encontrado.' }
        }
        email = profile.email
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, message: 'E-mail/CPF ou senha incorretos.' }
    return { ok: true }
}

export const signOut = async () => {
    await supabase.auth.signOut()
}

export const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
}

export const updateOwnProfile = async (profileId, fields) => {
    const { error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', profileId)
    if (error) return { ok: false, message: error.message }

    const metaFields = {}
    if (fields.name  !== undefined) metaFields.name  = fields.name
    if (fields.phone !== undefined) metaFields.phone = fields.phone
    if (Object.keys(metaFields).length) {
        await supabase.auth.updateUser({ data: metaFields })
    }
    return { ok: true }
}

export const adminCreateUser = async ({ name, document, email, phone, password, role }) => {
    const normalDoc = onlyDigits(document)

    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('document', normalDoc)
        .maybeSingle()
    if (existing) return { ok: false, message: 'Documento já cadastrado.' }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, document: normalDoc, phone, role } },
    })
    if (error) return { ok: false, message: error.message }
    return { ok: true, user: data.user }
}
