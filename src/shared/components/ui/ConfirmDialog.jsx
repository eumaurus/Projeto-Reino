import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar ação',
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    tone = 'danger',
    loading,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title={title}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={tone === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {tone === 'danger' && (
                    <div style={{
                        width: 44, height: 44,
                        borderRadius: 12,
                        background: 'var(--c-danger-soft)',
                        color: 'var(--c-danger)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <AlertTriangle size={22} />
                    </div>
                )}
                <p style={{ color: 'var(--c-gray-600)', lineHeight: 1.55 }}>{description}</p>
            </div>
        </Modal>
    )
}
