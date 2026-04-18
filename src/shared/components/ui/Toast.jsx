import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import './ui.css'

const ICONS = {
    success: CheckCircle2,
    error:   AlertCircle,
    warning: AlertTriangle,
    info:    Info,
}

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const idRef = useRef(0)

    const dismiss = useCallback((id) => {
        setToasts(list => list.filter(t => t.id !== id))
    }, [])

    const show = useCallback((opts) => {
        const id = ++idRef.current
        const { title, message, type = 'info', duration = 4500 } = typeof opts === 'string' ? { message: opts } : opts
        setToasts(list => [...list, { id, title, message, type }])
        if (duration > 0) setTimeout(() => dismiss(id), duration)
        return id
    }, [dismiss])

    const api = {
        show,
        success: (message, title) => show({ message, title, type: 'success' }),
        error:   (message, title) => show({ message, title, type: 'error' }),
        warning: (message, title) => show({ message, title, type: 'warning' }),
        info:    (message, title) => show({ message, title, type: 'info' }),
        dismiss,
    }

    return (
        <ToastCtx.Provider value={api}>
            {children}
            <div className="toast-stack">
                {toasts.map(t => {
                    const Icon = ICONS[t.type] ?? Info
                    return (
                        <div key={t.id} className={`toast toast-${t.type}`}>
                            <Icon size={20} className="toast-icon" />
                            <div className="toast-body">
                                {t.title && <strong>{t.title}</strong>}
                                {t.message}
                            </div>
                            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar">
                                <X size={16} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastCtx.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastCtx)
    if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
    return ctx
}
