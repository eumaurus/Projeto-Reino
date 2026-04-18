import { useCallback, useEffect, useState } from 'react'
import {
    listMyNotifications,
    markAsRead,
    markAllRead,
    subscribeToMyNotifications,
} from '../../services/notifications.service'
import { useAuth } from '../auth/AuthContext'

export function useNotifications() {
    const { currentUser } = useAuth()
    const [items,   setItems]   = useState([])
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        if (!currentUser) return
        try {
            const data = await listMyNotifications()
            setItems(data)
        } finally {
            setLoading(false)
        }
    }, [currentUser])

    useEffect(() => {
        if (!currentUser) return
        refresh()
        const unsub = subscribeToMyNotifications(currentUser.id, (n) => {
            setItems(list => [n, ...list])
        })
        return unsub
    }, [currentUser, refresh])

    const unread = items.filter(n => !n.readAt).length

    const markOne = useCallback(async (id) => {
        await markAsRead(id)
        setItems(list => list.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    }, [])

    const markAll = useCallback(async () => {
        await markAllRead()
        setItems(list => list.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
    }, [])

    return { items, unread, loading, refresh, markOne, markAll }
}
