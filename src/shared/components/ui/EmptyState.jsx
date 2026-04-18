import './ui.css'

export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="empty-state">
            {Icon && (
                <div className="empty-state-icon">
                    <Icon size={32} />
                </div>
            )}
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
            {action}
        </div>
    )
}
