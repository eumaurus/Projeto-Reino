import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react'
import './ui.css'

const ICONS = {
    info:    Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    danger:  AlertCircle,
}

export default function Alert({ tone = 'info', title, children }) {
    const Icon = ICONS[tone] ?? Info
    return (
        <div className={`alert alert-${tone}`} role="status">
            <Icon size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
                {title && <strong>{title}</strong>}
                {children}
            </div>
        </div>
    )
}
