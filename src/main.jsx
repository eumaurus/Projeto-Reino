import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

import './styles/tokens.css'
import './styles/reset.css'
import './styles/utilities.css'

// Apply stored theme early to avoid flash
try {
    const saved = localStorage.getItem('reino-theme')
    const theme = saved ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = theme
} catch {/* ignore */}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
