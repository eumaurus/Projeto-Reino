import { useRef, useState } from 'react'
import { Upload, X, FileText, Loader2, Image as ImageIcon } from 'lucide-react'
import './ui.css'

export default function FileUploader({
    value,
    onChange,
    onUpload,
    label = 'Anexo',
    hint = 'PDF, JPG, PNG ou WebP até 10 MB.',
    maxMB = 10,
    accept = 'image/*,application/pdf',
}) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)

    const handleFile = async (file) => {
        if (!file) return
        if (file.size > maxMB * 1024 * 1024) {
            setError(`Arquivo maior que ${maxMB} MB.`)
            return
        }
        setError(null)
        setUploading(true)
        try {
            const url = await onUpload(file)
            onChange?.(url, file)
        } catch (e) {
            setError(e.message ?? 'Falha no upload.')
        } finally {
            setUploading(false)
        }
    }

    const isPdf = (value ?? '').toLowerCase().endsWith('.pdf')
    const filename = value ? value.split('/').pop() : null

    return (
        <div className="field">
            {label && <span className="field-label">{label}</span>}

            {value ? (
                <div className="file-uploader-filled">
                    <div className="file-uploader-icon">
                        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={value} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {filename}
                        </a>
                        <span style={{ fontSize: 11, color: 'var(--c-gray-500)' }}>Arquivo enviado</span>
                    </div>
                    <button type="button" className="icon-btn" onClick={() => onChange?.(null)} aria-label="Remover">
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    className="file-uploader-drop"
                    onClick={() => !uploading && inputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer?.files?.[0]) }}
                    disabled={uploading}
                >
                    {uploading
                        ? <><Loader2 size={18} className="img-uploader-spin" /> Enviando…</>
                        : <><Upload size={18} /> Clique ou arraste um arquivo</>
                    }
                </button>
            )}

            {error && <span className="field-error">{error}</span>}
            {!error && hint && <span className="field-hint">{hint}</span>}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
        </div>
    )
}
