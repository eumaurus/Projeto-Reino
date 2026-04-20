import { onlyDigits } from './masks'

// ASCII-only e-mail — Supabase rejeita caracteres não-ASCII (ç, acentos, etc.)
export const isValidEmail = (v) => /^[\x20-\x7F]+$/.test(String(v ?? '').trim())
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim())

export const isValidCPF = (raw) => {
    const cpf = onlyDigits(raw)
    if (cpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cpf)) return false

    const calc = (slice) => {
        let sum = 0
        for (let i = 0; i < slice.length; i++) sum += Number(slice[i]) * (slice.length + 1 - i)
        const rem = (sum * 10) % 11
        return rem === 10 ? 0 : rem
    }
    return calc(cpf.slice(0, 9))  === Number(cpf[9])
        && calc(cpf.slice(0, 10)) === Number(cpf[10])
}

export const isValidCNPJ = (raw) => {
    const cnpj = onlyDigits(raw)
    if (cnpj.length !== 14) return false
    if (/^(\d)\1+$/.test(cnpj)) return false

    const digits = cnpj.split('').map(Number)
    const calcDigit = (weights, nums) => {
        const sum = weights.reduce((acc, w, i) => acc + w * nums[i], 0)
        const rem = sum % 11
        return rem < 2 ? 0 : 11 - rem
    }
    const d1 = calcDigit([5,4,3,2,9,8,7,6,5,4,3,2], digits.slice(0, 12))
    const d2 = calcDigit([6,5,4,3,2,9,8,7,6,5,4,3,2], digits.slice(0, 13))
    return d1 === digits[12] && d2 === digits[13]
}

export const isValidDocument = (v) => {
    const raw = onlyDigits(v)
    return raw.length === 11 ? isValidCPF(raw) : raw.length === 14 ? isValidCNPJ(raw) : false
}

export const isValidPhone = (v) => onlyDigits(v).length >= 10
