import { AlertCircle } from 'lucide-react'
import './ui.css'

export default function FormField({
    label,
    icon: Icon,
    suffix,
    error,
    hint,
    children,
    htmlFor,
    required,
}) {
    return (
        <div className="field">
            {label && (
                <label className="field-label" htmlFor={htmlFor}>
                    {label}{required && <span style={{ color: 'var(--c-danger)' }}> *</span>}
                </label>
            )}
            <div className={`field-input-wrap ${error ? 'has-error' : ''}`}>
                {Icon && <span className="field-icon"><Icon size={16} /></span>}
                {children}
                {suffix && <span className="field-suffix">{suffix}</span>}
            </div>
            {error && (
                <span className="field-error">
                    <AlertCircle size={13} /> {error}
                </span>
            )}
            {!error && hint && <span className="field-hint">{hint}</span>}
        </div>
    )
}

export function TextInput({ id, type = 'text', ...rest }) {
    return <input id={id} type={type} {...rest} />
}

export function TextareaInput({ id, rows = 4, ...rest }) {
    return <textarea id={id} rows={rows} {...rest} />
}

export function SelectInput({ id, options = [], placeholder, ...rest }) {
    return (
        <select id={id} {...rest}>
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    )
}
