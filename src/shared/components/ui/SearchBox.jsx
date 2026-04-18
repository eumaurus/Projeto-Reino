import { Search, X } from 'lucide-react'
import './ui.css'

export default function SearchBox({ value, onChange, placeholder = 'Buscar...' }) {
    return (
        <div className="search-box">
            <Search size={16} />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                type="search"
            />
            {value && (
                <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 28, height: 28 }}
                    onClick={() => onChange('')}
                    aria-label="Limpar"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    )
}
