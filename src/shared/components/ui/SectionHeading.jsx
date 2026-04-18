import './ui.css'

export default function SectionHeading({ icon: Icon, children, action }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 className="section-heading" style={{ margin: 0 }}>
                {Icon && <Icon size={20} />}
                {children}
            </h2>
            {action}
        </div>
    )
}
