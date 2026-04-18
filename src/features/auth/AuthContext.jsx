import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { signInWithIdentifier, signOut as svcSignOut } from '../../services/auth.service'
import { getProfile } from '../../services/profiles.service'

const AuthCtx = createContext(null)

const buildBaseUser = (session) => {
    if (!session?.user) return null
    const meta = session.user.user_metadata ?? {}
    return {
        id:        session.user.id,
        email:     session.user.email,
        name:      meta.name     ?? '',
        document:  meta.document ?? '',
        phone:     meta.phone    ?? '',
        role:      meta.role     ?? 'client',
        avatarUrl: meta.avatar_url ?? null,
    }
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [isLoading,   setLoading]     = useState(true)

    const refreshProfile = useCallback(async (user) => {
        if (!user) return null
        try {
            const profile = await getProfile(user.id)
            if (!profile) return user
            const merged = {
                ...user,
                name:      profile.name     ?? user.name,
                document:  profile.document  ?? user.document,
                phone:     profile.phone     ?? user.phone,
                role:      profile.role      ?? user.role,
                avatarUrl: profile.avatar_url ?? user.avatarUrl,
                bio:       profile.bio       ?? null,
                crmv:      profile.crmv      ?? null,
            }
            setCurrentUser(merged)
            return merged
        } catch {
            return user
        }
    }, [])

    useEffect(() => {
        let mounted = true

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!mounted) return
            const base = buildBaseUser(session)
            if (base) {
                setCurrentUser(base)
                await refreshProfile(base)
            }
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_evt, session) => {
            const base = buildBaseUser(session)
            setCurrentUser(base)
            setLoading(false)
            if (base) refreshProfile(base)
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [refreshProfile])

    const login = useCallback(async (identifier, password) => {
        const result = await signInWithIdentifier(identifier, password)
        if (!result.ok) return { success: false, message: result.message }
        return { success: true }
    }, [])

    const logout = useCallback(async () => {
        await svcSignOut()
        setCurrentUser(null)
    }, [])

    return (
        <AuthCtx.Provider value={{ currentUser, isLoading, login, logout, refreshProfile }}>
            {children}
        </AuthCtx.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthCtx)
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
    return ctx
}
