import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Microscope, Save } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { createExam } from '../../services/exams.service'
import { uploadExamFile } from '../../services/storage.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField, { SelectInput } from '../../shared/components/ui/FormField'
import FileUploader from '../../shared/components/ui/FileUploader'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Alert from '../../shared/components/ui/Alert'
import { useToast } from '../../shared/components/ui/Toast'
import { EXAM_CATEGORIES, EXAM_SUGGESTIONS } from '../../shared/constants/statuses'
import './vet.css'

export default function NewExamPage() {
    const { petId } = useParams()
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const toast = useToast()

    const petQuery = useAsync(() => getPetById(petId), [petId])
    const pet = petQuery.data

    const [type,       setType]       = useState('')
    const [category,   setCategory]   = useState('laboratorial')
    const [results,    setResults]    = useState('')
    const [conclusion, setConclusion] = useState('')
    const [fileUrl,    setFileUrl]    = useState(null)
    const [saving,     setSaving]     = useState(false)

    const suggestions = EXAM_SUGGESTIONS[category] ?? []

    const submit = async (e) => {
        e.preventDefault()
        if (!type.trim()) return toast.error('Informe o tipo de exame.')
        setSaving(true)
        try {
            await createExam({
                petId:      pet.id,
                ownerId:    pet.ownerId,
                vetId:      currentUser.id,
                type:       type.trim(),
                category,
                results:    results.trim() || null,
                conclusion: conclusion.trim() || null,
                fileUrl:    fileUrl,
                status:     (results.trim() || fileUrl) ? 'completed' : 'requested',
            })
            toast.success('Exame registrado. Tutor será notificado.')
            navigate(`/vet/patients/${pet.id}`)
        } catch (err) {
            toast.error(err.message ?? 'Falha ao registrar exame.')
        } finally {
            setSaving(false)
        }
    }

    if (petQuery.loading) return <SkeletonRows rows={6} height={40} />
    if (!pet) return <Alert tone="danger">Paciente não encontrado.</Alert>

    return (
        <>
            <Link to={`/vet/patients/${pet.id}`} className="breadcrumbs">
                <ArrowLeft size={14} /> {pet.name}
            </Link>

            <PageHeader
                eyebrow="Exames"
                title={`Solicitar exame — ${pet.name}`}
                subtitle={`Se você já tem os resultados, preencha a seção 'Resultados' e o exame entrará como concluído.`}
            />

            <form className="clinical-form" onSubmit={submit}>
                <div className="clinical-form-row">
                    <FormField label="Categoria" htmlFor="cat">
                        <SelectInput
                            id="cat"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            options={EXAM_CATEGORIES.map(c => ({ value: c.id, label: c.label }))}
                        />
                    </FormField>
                    <FormField label="Tipo do exame" icon={Microscope} htmlFor="type">
                        <input id="type" value={type} onChange={(e) => setType(e.target.value)} placeholder="Ex.: Hemograma completo" list="exam-suggestions" />
                        <datalist id="exam-suggestions">
                            {suggestions.map(s => <option key={s} value={s} />)}
                        </datalist>
                    </FormField>
                </div>

                <FormField label="Resultados (opcional)" htmlFor="results" hint="Preencha se já tiver o resultado em mãos.">
                    <textarea id="results" rows={4} value={results} onChange={(e) => setResults(e.target.value)} />
                </FormField>

                <FormField label="Conclusão clínica" htmlFor="conclusion">
                    <textarea id="conclusion" rows={3} value={conclusion} onChange={(e) => setConclusion(e.target.value)} placeholder="Ex.: parâmetros dentro da normalidade." />
                </FormField>

                <FileUploader
                    label="Arquivo do exame (opcional)"
                    hint="Anexe o laudo em PDF ou imagem. Máx. 10 MB."
                    value={fileUrl}
                    onChange={(url) => setFileUrl(url)}
                    onUpload={(file) => uploadExamFile(file, pet.id)}
                />

                <div className="clinical-form-actions">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancelar</Button>
                    <Button type="submit" icon={Save} loading={saving}>Registrar exame</Button>
                </div>
            </form>
        </>
    )
}
