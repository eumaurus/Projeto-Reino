export const formatBRL = (value) => {
    if (value == null || value === '') return '—'
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

export const initials = (name = '') => {
    const parts = String(name).trim().split(/\s+/)
    if (!parts[0]) return '?'
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const truncate = (text, max = 60) => {
    const s = String(text ?? '')
    return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…'
}

export const pluralize = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`
