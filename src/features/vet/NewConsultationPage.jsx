import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Save, Stethoscope } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useAsync } from '../../shared/hooks/useAsync'
import { getPetById } from '../../services/pets.service'
import { createConsultation } from '../../services/consultations.service'
import { updateBookingStatus } from '../../services/bookings.service'
import PageHeader from '../../shared/components/ui/PageHeader'
import Button from '../../shared/components/ui/Button'
import FormField from '../../shared/components/ui/FormField'
import { SkeletonRows } from '../../shared/components/ui/Skeleton'
import Alert from '../../shared/components/ui/Alert'
import { useToast } from '../../shared/components/ui/Toast'

export default function NewConsultationPage() {
    const { petId } = useParams()
    const [params] = useSearchParams()
    const bookingId = params.get('bookingId')
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const toast = useToast()

    const petQuery = useAsync(() => getPetById(petId), [petId])
    const pet = petQuery.data

    const [form, setForm] = useState({
        reason:       '',
        anamnesis:    '',
        procedures:   '',
        diagnosis:    '',
        treatment:    '',
        notes:        '',
        weightKg:     '',
        temperatureC: '',
        heartRate:    '',
    })
    const [saving, setSaving] = useState(false)

    const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        if (!form.reason.trim() && !form.diagnosis.trim() && !form.procedures.trim()) {
            return toast.error('Preencha ao menos um campo clínico (motivo, diagnóstico ou procedimentos).')
        }
        setSaving(true)
        try {
            await createConsultation({
                petId:        pet.id,
                ownerId:      pet.ownerId,
                vetId:        currentUser.id,
                bookingId:    bookingId || null,
                reason:       form.reason.trim(),
                anamnesis:    form.anamnesis.trim(),
                procedures:   form.procedures.trim(),
                diagnosis:    form.diagnosis.trim(),
                treatment:    form.treatment.trim(),
                notes:        form.notes.trim(),
                weightKg:     form.weightKg     ? Number(form.weightKg.replace(',', '.'))  : null,
                temperatureC: form.temperatureC ? Number(form.temperatureC.replace(',', '.')) : null,
                heartRate:    form.heartRate    ? Number(form.heartRate) : null,
            })
            if (bookingId) {
                try { await updateBookingStatus(bookingId, 'done') } catch { /* mantém mesmo se falhar */ }
            }
            toast.success('Consulta registrada com sucesso!')
            navigate(`/vet/patients/${pet.id}`)
        } catch (err) {
            toast.error(err.message ?? 'Falha ao registrar consulta.')
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
                eyebrow="Prontuário"
                title={`Nova consulta — ${pet.name}`}
                subtitle={`Tutor: ${pet.owner?.name ?? '—'} · ${pet.species} · ${pet.breed ?? 'SRD'}`}
            />

            {bookingId && (
                <Alert tone="info">
                    Esta consulta está vinculada a um agendamento. Ao salvar, o agendamento será marcado como <strong>realizado</strong> automaticamente.
                </Alert>
            )}

            <form className="clinical-form" onSubmit={submit} style={{ marginTop: '1rem' }}>
                <FormField label="Motivo da consulta" icon={Stethoscope} htmlFor="reason">
                    <input id="reason" value={form.reason} onChange={set('reason')} placeholder="Ex.: rotina, vacinação, avaliação clínica, retorno..." />
                </FormField>

                <div className="clinical-form-row">
                    <FormField label="Peso (kg)"        htmlFor="c-weight"><input id="c-weight" value={form.weightKg} onChange={set('weightKg')} placeholder="12.4" /></FormField>
                    <FormField label="Temperatura (°C)" htmlFor="c-temp"><input id="c-temp" value={form.temperatureC} onChange={set('temperatureC')} placeholder="38.5" /></FormField>
                    <FormField label="Freq. cardíaca (bpm)" htmlFor="c-heart"><input id="c-heart" value={form.heartRate} onChange={set('heartRate')} placeholder="120" /></FormField>
                </div>

                <FormField label="Anamnese / Histórico" htmlFor="anamnesis" hint="Descreva a queixa do tutor, evolução dos sintomas, histórico recente.">
                    <textarea id="anamnesis" rows={3} value={form.anamnesis} onChange={set('anamnesis')} />
                </FormField>

                <FormField label="Procedimentos realizados" htmlFor="procedures">
                    <textarea id="procedures" rows={3} value={form.procedures} onChange={set('procedures')} placeholder="Ex.: exame físico geral, aferição de sinais vitais, curativo..." />
                </FormField>

                <FormField label="Diagnóstico" htmlFor="diagnosis">
                    <textarea id="diagnosis" rows={3} value={form.diagnosis} onChange={set('diagnosis')} />
                </FormField>

                <FormField label="Plano terapêutico / Tratamento" htmlFor="treatment" hint="Descreva o tratamento recomendado, cuidados e retorno. A receita é emitida em etapa separada.">
                    <textarea id="treatment" rows={3} value={form.treatment} onChange={set('treatment')} />
                </FormField>

                <FormField label="Observações adicionais" htmlFor="notes">
                    <textarea id="notes" rows={2} value={form.notes} onChange={set('notes')} />
                </FormField>

                <div className="clinical-form-actions">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)} disabled={saving}>Cancelar</Button>
                    <Button type="submit" icon={Save} loading={saving}>Salvar prontuário</Button>
                </div>
            </form>
        </>
    )
}
