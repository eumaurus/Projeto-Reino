import './ui.css'

export default function Tabs({ value, onChange, items }) {
    return (
        <div className="tabs" role="tablist">
            {items.map(item => {
                const Icon = item.icon
                const active = value === item.value
                return (
                    <button
                        key={item.value}
                        role="tab"
                        aria-selected={active}
                        className={`tab ${active ? 'tab-active' : ''}`}
                        onClick={() => onChange(item.value)}
                        disabled={item.disabled}
                    >
                        {Icon && <Icon size={16} />}
                        {item.label}
                        {item.count != null && (
                            <span style={{
                                marginLeft: 4,
                                padding: '1px 8px',
                                background: active ? 'var(--brand-primary-soft)' : 'var(--c-gray-100)',
                                borderRadius: 'var(--r-full)',
                                fontSize: 11,
                                color: active ? 'var(--brand-secondary)' : 'var(--c-gray-600)',
                            }}>
                                {item.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
