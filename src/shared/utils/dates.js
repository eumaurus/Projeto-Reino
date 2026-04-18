const MONTHS_PT = [
    'jan','fev','mar','abr','mai','jun',
    'jul','ago','set','out','nov','dez',
]

const MONTHS_LONG_PT = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro',
]

const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_LONG_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const parseDate = (v) => {
    if (!v) return null
    if (v instanceof Date) return v
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split('-').map(Number)
        return new Date(y, m - 1, d)
    }
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
}

export const formatDate = (v, { withWeekday = false } = {}) => {
    const d = parseDate(v)
    if (!d) return '—'
    const base = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    return withWeekday ? `${WEEKDAY_PT[d.getDay()]}, ${base}` : base
}

export const formatDateLong = (v) => {
    const d = parseDate(v)
    if (!d) return '—'
    return `${d.getDate()} de ${MONTHS_LONG_PT[d.getMonth()]} de ${d.getFullYear()}`
}

export const formatDateShort = (v) => {
    const d = parseDate(v)
    if (!d) return '—'
    return `${d.getDate()} ${MONTHS_PT[d.getMonth()]}`
}

export const formatTime = (v) => {
    if (!v) return '—'
    return String(v).slice(0, 5)
}

export const formatDateTime = (v) => {
    const d = parseDate(v)
    if (!d) return '—'
    const dt = formatDate(d)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${dt} às ${hh}:${mm}`
}

export const formatRelative = (v) => {
    const d = parseDate(v)
    if (!d) return ''
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'agora'
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
    if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`
    return formatDate(d)
}

export const toISODate = (d) => {
    if (!d) return null
    const date = d instanceof Date ? d : parseDate(d)
    if (!date) return null
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const todayISO = () => toISODate(new Date())

export const weekdayName = (v, long = false) => {
    const d = parseDate(v)
    if (!d) return ''
    return long ? WEEKDAY_LONG_PT[d.getDay()] : WEEKDAY_PT[d.getDay()]
}

export const addDays = (d, n) => {
    const base = parseDate(d) ?? new Date()
    base.setDate(base.getDate() + n)
    return base
}

export const isPast = (v) => {
    const d = parseDate(v)
    if (!d) return false
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return d < t
}

export const monthLabel = (v) => {
    const d = parseDate(v)
    if (!d) return ''
    return `${MONTHS_LONG_PT[d.getMonth()][0].toUpperCase()}${MONTHS_LONG_PT[d.getMonth()].slice(1)} de ${d.getFullYear()}`
}

/** Time slots based on Reino Animal hours (seg-sex 9-18, sáb 9-14, dom fechado) */
export const getAvailableTimeSlots = (date) => {
    const d = parseDate(date)
    if (!d) return []
    const day = d.getDay()
    if (day === 0) return []
    const end = day === 6 ? 14 : 18
    const slots = []
    for (let h = 9; h < end; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`)
        slots.push(`${String(h).padStart(2, '0')}:30`)
    }
    return slots
}

export const getNextBusinessDays = (count = 14) => {
    const days = []
    let cursor = 0
    while (days.length < count && cursor < count * 2) {
        const d = addDays(new Date(), cursor)
        if (d.getDay() !== 0) days.push(d)
        cursor++
    }
    return days
}
