import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import './ui.css'

const MAX_MB = 5

export default function ImageUploader({
    value,
    onChange,
    onUpload,
    label = 'Foto',
    hint = 'JPG, PNG ou WebP até 5 MB.',
    shape = 'square',
}) {
    const inputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [error,     setError]     = useState(null)

    const handleFile = async (file) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('O arquivo precisa ser uma imagem.')
            return
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            setError(`Imagem maior que ${MAX_MB} MB.`)
            return
        }
        setError(null)
        setUploading(true)
        try {
            const url = await onUpload(file)
            onChange?.(url)
        } catch (e) {
            setError(e.message ?? 'Falha no upload.')
        } finally {
            setUploading(false)
        }
    }

    const onDrop = (e) => {
        e.preventDefault()
        if (uploading) return
        const file = e.dataTransfer?.files?.[0]
        if (file) handleFile(file)
    }

    return (
        <div className="field">
            {label && <span className="field-label">{label}</span>}

            <div
                className={`img-uploader img-uploader-${shape} ${value ? 'has-image' : ''}`}
                onClick={() => !uploading && inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
            >
                {value ? (
                    <>
                        <img src={value} alt="Preview" />
                        <div className="img-uploader-overlay">
                            <Upload size={18} /> Trocar imagem
                        </div>
                        {!uploading && (
                            <button
                                type="button"
                                className="img-uploader-remove"
                                onClick={(e) => { e.stopPropagation(); onChange?.(null) }}
                                aria-label="Remover imagem"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </>
                ) : (
                    <div className="img-uploader-empty">
                        {uploading
                            ? <Loader2 size={24} className="img-uploader-spin" />
                            : <ImageIcon size={28} />
                        }
                        <strong>{uploading ? 'Enviando...' : 'Arraste uma imagem'}</strong>
                        {!uploading && <span>ou clique para selecionar</span>}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files?.[0])}
                />
            </div>

            {hint  && !error && <span className="field-hint">{hint}</span>}
            {error && <span className="field-error">{error}</span>}
        </div>
    )
}
