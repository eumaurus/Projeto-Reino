import { useMemo } from 'react'
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { formatDateShort } from '../../shared/utils/dates'

const COLORS = ['#73c6e8', '#505273', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']

export function BookingsTrendChart({ bookings }) {
    const data = useMemo(() => {
        const byDate = new Map()
        for (const b of bookings) {
            const d = b.requestedDate
            byDate.set(d, (byDate.get(d) ?? 0) + 1)
        }
        return Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-30)
            .map(([date, count]) => ({ date: formatDateShort(date), count }))
    }, [bookings])

    return (
        <div className="chart-card">
            <div className="chart-card-header">
                <strong>Agendamentos por dia</strong>
                <span>Últimos 30 dias</span>
            </div>
            <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
                        <YAxis allowDecimals={false} fontSize={11} stroke="#64748b" />
                        <Tooltip
                            cursor={{ fill: 'rgba(115,198,232,0.12)' }}
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Bar dataKey="count" fill="#73c6e8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export function ServicesDistributionChart({ bookings }) {
    const data = useMemo(() => {
        const bySvc = new Map()
        for (const b of bookings) {
            bySvc.set(b.service, (bySvc.get(b.service) ?? 0) + 1)
        }
        return Array.from(bySvc.entries()).map(([name, value]) => ({ name, value }))
    }, [bookings])

    if (!data.length) return null

    return (
        <div className="chart-card">
            <div className="chart-card-header">
                <strong>Distribuição de serviços</strong>
                <span>Total de atendimentos</span>
            </div>
            <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Legend
                            layout="vertical"
                            align="right"
                            verticalAlign="middle"
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 12 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export function StatusBreakdownChart({ stats }) {
    if (!stats) return null
    const data = [
        { name: 'Pendentes',   value: stats.pending,   fill: '#f59e0b' },
        { name: 'Confirmados', value: stats.confirmed, fill: '#3b82f6' },
        { name: 'Realizados',  value: stats.done,      fill: '#10b981' },
        { name: 'Cancelados',  value: stats.cancelled, fill: '#94a3b8' },
    ].filter(d => d.value > 0)

    return (
        <div className="chart-card">
            <div className="chart-card-header">
                <strong>Status dos agendamentos</strong>
                <span>Visão consolidada</span>
            </div>
            <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#64748b" />
                        <YAxis type="category" dataKey="name" fontSize={11} stroke="#64748b" width={90} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export function RevenueTrendChart({ bookings }) {
    const data = useMemo(() => {
        const byMonth = new Map()
        for (const b of bookings) {
            if (b.status !== 'done') continue
            const monthKey = b.requestedDate.slice(0, 7)
            byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 180)
        }
        return Array.from(byMonth.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([m, v]) => ({ month: m.slice(5) + '/' + m.slice(2,4), revenue: v }))
    }, [bookings])

    if (!data.length) return null

    return (
        <div className="chart-card">
            <div className="chart-card-header">
                <strong>Receita estimada</strong>
                <span>Por mês — base R$ 180/consulta realizada</span>
            </div>
            <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                        <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => `R$ ${v}`} />
                        <Tooltip
                            formatter={(v) => `R$ ${v.toLocaleString('pt-BR')}`}
                            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#505273" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
