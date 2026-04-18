export const onlyDigits = (value = '') => String(value).replace(/\D/g, '')

export const maskCPF = (value) =>
    onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')

export const maskCNPJ = (value) =>
    onlyDigits(value)
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')

export const maskDocument = (value) => {
    if (/[a-zA-Z@]/.test(value)) return value
    const raw = onlyDigits(value)
    if (!raw) return ''
    return raw.length <= 11 ? maskCPF(raw) : maskCNPJ(raw)
}

export const maskPhone = (value) =>
    onlyDigits(value)
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')

export const formatDocument = (doc = '') => {
    const raw = onlyDigits(doc)
    return raw.length === 11 ? maskCPF(raw) : raw.length === 14 ? maskCNPJ(raw) : doc
}
