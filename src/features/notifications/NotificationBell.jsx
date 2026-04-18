import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, Check } from 'lucide-react'
import { useNotifications } from './useNotifications'
import { formatRelative } from '../../shared/utils/dates'
import './notifications.css'

export default function NotificationBell() {
    const { items, unread, markOne, markAll } = useNotifications()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (!open) return
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const onOpen = (n) => {
        setOpen(false)
        if (!n.readAt) markOne(n.id)
        if (n.link) navigate(n.link)
    }

    return (
        <div className="notif-wrap" ref={ref}>
            <button
                type="button"
                className="notif-btn"
                onClick={() => setOpen(o => !o)}
                aria-label="Notificações"
            >
                <Bell size={18} />
                {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {open && (
                <div className="notif-panel">
                    <header>
                        <strong>Notificações</strong>
                        {unread > 0 && (
                            <button className="notif-mark-all" onClick={markAll}>
                                <Check size={12} /> Marcar todas como lidas
                            </button>
                        )}
                    </header>

                    <div className="notif-list">
                        {items.length === 0 && (
                            <div className="notif-empty">
                                <BellOff size={24} />
                                <span>Nenhuma notificação por aqui.</span>
                            </div>
                        )}
                        {items.slice(0, 15).map(n => (
                            <button
                                key={n.id}
                                className={`notif-item ${!n.readAt ? 'unread' : ''}`}
                                onClick={() => onOpen(n)}
                            >
                                <div className="notif-item-dot" />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <strong>{n.title}</strong>
                                    {n.body && <p>{n.body}</p>}
                                    <span>{formatRelative(n.createdAt)}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
