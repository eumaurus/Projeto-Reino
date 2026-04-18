import { useEffect } from 'react'
import { X } from 'lucide-react'
import './ui.css'

export default function Modal({
    open,
    onClose,
    title,
    description,
    size = 'md',
    footer,
    children,
    closeOnBackdrop = true,
}) {
    useEffect(() => {
        if (!open) return
        const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div
            className="modal-overlay"
            onClick={closeOnBackdrop ? onClose : undefined}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`modal modal-${size}`}
                onClick={(e) => e.stopPropagation()}
            >
                {(title || description) && (
                    <div className="modal-header">
                        <div className="modal-header-text">
                            {title && <h2>{title}</h2>}
                            {description && <p>{description}</p>}
                        </div>
                        <button className="icon-btn" onClick={onClose} aria-label="Fechar">
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    )
}
