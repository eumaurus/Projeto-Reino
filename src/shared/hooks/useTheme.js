import { useEffect, useState } from 'react'

const STORAGE_KEY = 'reino-theme'

const getInitial = () => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
    const [theme, setTheme] = useState(getInitial)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

    return { theme, toggle, setTheme }
}
