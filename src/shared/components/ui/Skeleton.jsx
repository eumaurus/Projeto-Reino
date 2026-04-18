import './ui.css'

export default function Skeleton({ height = 20, width = '100%', radius, style = {} }) {
    return (
        <div
            className="skeleton"
            style={{
                height,
                width,
                borderRadius: radius,
                ...style,
            }}
        />
    )
}

export function SkeletonRows({ rows = 3, gap = 12, height = 20 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} height={height} width={`${80 + (i % 3) * 7}%`} />
            ))}
        </div>
    )
}

export function SkeletonCards({ count = 3 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Skeleton height={180} />
                    <Skeleton height={22} width="60%" />
                    <Skeleton height={16} width="85%" />
                </div>
            ))}
        </div>
    )
}
