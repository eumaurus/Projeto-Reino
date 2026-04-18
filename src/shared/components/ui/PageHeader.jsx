import './ui.css'

export default function PageHeader({ title, subtitle, actions, eyebrow }) {
    return (
        <div className="page-header">
            <div className="page-header-text">
                {eyebrow && (
                    <div style={{
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 700,
                        color: 'var(--brand-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 4,
                    }}>
                        {eyebrow}
                    </div>
                )}
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="page-header-actions">{actions}</div>}
        </div>
    )
}
