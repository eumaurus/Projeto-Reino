import { initials } from '../../utils/formatters'
import './ui.css'

export default function Avatar({ name, src, size = 'md' }) {
    return (
        <span className={`avatar avatar-${size}`} aria-label={name}>
            {src ? <img src={src} alt={name ?? ''} /> : initials(name)}
        </span>
    )
}
