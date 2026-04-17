import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../utils/supabaseClient'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setCurrentUser(buildUser(session))
            setIsLoading(false)
        }).catch(() => setIsLoading(false))

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session ? buildUser(session) : null)
            setIsLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Lê dados do JWT (user_metadata) — sem query ao banco, nunca trava
    const buildUser = (session) => {
        const meta = session.user.user_metadata ?? {}
        return {
            id:       session.user.id,
            email:    session.user.email,
            name:     meta.name     ?? '',
            document: meta.document ?? '',
            phone:    meta.phone    ?? '',
            role:     meta.role     ?? 'client',
        }
    }

    const login = async (identifier, password) => {
        let email = identifier.trim()

        if (!email.includes('@')) {
            const normalDoc = email.replace(/\D/g, '')
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('document', normalDoc)
                .maybeSingle()

            if (!profile?.email) {
                return { success: false, message: 'CPF/CNPJ não encontrado.' }
            }
            email = profile.email
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { success: false, message: 'E-mail/CPF ou senha incorretos.' }

        return { success: true }
    }

    const logout = async () => {
        await supabase.auth.signOut()
        setCurrentUser(null)
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}
