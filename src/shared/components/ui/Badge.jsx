import './ui.css'

export default function Badge({ tone = 'info', icon: Icon, children }) {
    return (
        <span className={`badge badge-${tone}`}>
            {Icon && <Icon size={12} />}
            {children}
        </span>
    )
}

export function StatusBadge({ value, map }) {
    const entry = map?.[value]
    if (!entry) return <Badge tone="muted">{value}</Badge>
    return <Badge tone={entry.tone}>{entry.label}</Badge>
}
