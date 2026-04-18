import './ui.css'

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
    return (
        <div className={`stat-card ${tone !== 'brand' ? `stat-tone-${tone}` : ''}`}>
            {Icon && (
                <div className="stat-icon-box">
                    <Icon size={24} />
                </div>
            )}
            <div className="stat-content">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
                {hint && <div className="stat-hint">{hint}</div>}
            </div>
        </div>
    )
}
