import { supabase } from './supabase'

const rowToNotification = (r) => ({
    id:        r.id,
    userId:    r.user_id,
    type:      r.type,
    title:     r.title,
    body:      r.body,
    link:      r.link,
    readAt:    r.read_at,
    createdAt: r.created_at,
})

export const listMyNotifications = async (limit = 30) => {
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes?.user) return []

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userRes.user.id)
        .order('created_at', { ascending: false })
        .limit(limit)
    if (error) throw error
    return (data ?? []).map(rowToNotification)
}

export const markAsRead = async (id) => {
    const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
    if (error) throw error
}

export const markAllRead = async () => {
    const { data: userRes } = await supabase.auth.getUser()
    if (!userRes?.user) return
    const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userRes.user.id)
        .is('read_at', null)
    if (error) throw error
}

export const subscribeToMyNotifications = (userId, onInsert) => {
    const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload) => onInsert(rowToNotification(payload.new)),
        )
        .subscribe()

    return () => { supabase.removeChannel(channel) }
}
