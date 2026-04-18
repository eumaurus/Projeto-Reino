import { jsPDF } from 'jspdf'
import { CLINIC } from '../../constants/clinic'
import { formatDate, formatDateLong, formatDateTime } from '../dates'

const BRAND_HEX   = '#505273'
const PRIMARY_HEX = '#73c6e8'

export function downloadMedicalRecordPdf({ pet, owner, consultations, prescriptions, exams }) {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth  = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 18
    let y = 0

    // ─── Cover ────────────────────────────────────────────────
    doc.setFillColor(PRIMARY_HEX)
    doc.rect(0, 0, pageWidth, 44, 'F')
    doc.setTextColor('#ffffff')
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Prontuário do Pet', margin, 22)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`${CLINIC.name} · ${CLINIC.address}`, margin, 30)
    doc.text(`Emitido em ${formatDateLong(new Date())}`, margin, 37)

    y = 60

    doc.setTextColor(BRAND_HEX)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(pet.name, margin, y)
    y += 8

    doc.setTextColor('#475569')
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
        [
            pet.species, pet.breed, pet.age, pet.weight,
        ].filter(Boolean).join(' · '),
        margin, y,
    )
    y += 8

    doc.text(`Tutor: ${owner?.name ?? '—'}${owner?.phone ? ` · ${owner.phone}` : ''}`, margin, y)
    y += 6
    doc.text(`Código do pet: #${pet.id}`, margin, y)
    y += 10

    const needPageBreak = (requiredSpace = 30) => {
        if (y + requiredSpace > pageHeight - 20) {
            doc.addPage()
            y = 20
        }
    }

    const sectionTitle = (title) => {
        needPageBreak(16)
        doc.setFillColor(PRIMARY_HEX)
        doc.setDrawColor(PRIMARY_HEX)
        doc.roundedRect(margin, y - 1, pageWidth - margin * 2, 8, 1.5, 1.5, 'F')
        doc.setTextColor('#ffffff')
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(title.toUpperCase(), margin + 4, y + 4.5)
        y += 14
    }

    const paragraph = (text, opts = {}) => {
        doc.setFontSize(opts.size ?? 9.5)
        doc.setTextColor(opts.color ?? '#334155')
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2)
        lines.forEach((line) => {
            needPageBreak(6)
            doc.text(line, margin, y)
            y += 4.5
        })
        y += 2
    }

    const labelInline = (label, value) => {
        needPageBreak(6)
        doc.setFontSize(9)
        doc.setTextColor('#94a3b8')
        doc.setFont('helvetica', 'bold')
        doc.text(label.toUpperCase(), margin, y)

        doc.setFontSize(10)
        doc.setTextColor('#334155')
        doc.setFont('helvetica', 'normal')
        doc.text(String(value ?? '—'), margin + 38, y)
        y += 6
    }

    // ─── Vaccines ────────────────────────────────────────────
    sectionTitle('Histórico de vacinas')
    const vaccines = (pet.vaccines ?? []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||''))
    if (!vaccines.length) paragraph('Nenhuma vacina registrada.')
    else {
        vaccines.forEach(v => {
            needPageBreak(10)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor('#1e293b')
            doc.setFontSize(10)
            doc.text(`• ${v.name}`, margin, y)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor('#475569')
            doc.setFontSize(9)
            const meta = [
                `Aplicada em ${formatDate(v.date)}`,
                v.nextDue ? `Reforço ${formatDate(v.nextDue)}` : null,
                v.vet ? `Dr(a). ${v.vet}` : null,
            ].filter(Boolean).join('  ·  ')
            doc.text(meta, margin + 4, y + 5)
            y += 10
        })
    }

    // ─── Consultations ──────────────────────────────────────
    sectionTitle('Consultas')
    if (!consultations?.length) paragraph('Nenhuma consulta registrada.')
    else {
        consultations.forEach(c => {
            needPageBreak(40)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(BRAND_HEX)
            doc.setFontSize(11)
            doc.text(`${c.reason || 'Consulta'} — ${formatDateTime(c.consultedAt)}`, margin, y)
            y += 5
            if (c.vet?.name) {
                doc.setFont('helvetica', 'normal')
                doc.setTextColor('#64748b')
                doc.setFontSize(9)
                doc.text(`Dr(a). ${c.vet.name}${c.vet.crmv ? ` · CRMV ${c.vet.crmv}` : ''}`, margin, y)
                y += 5
            }
            const vitals = [
                c.weightKg ? `Peso ${c.weightKg} kg` : null,
                c.temperatureC ? `Temp. ${c.temperatureC} °C` : null,
                c.heartRate ? `FC ${c.heartRate} bpm` : null,
            ].filter(Boolean).join('  ·  ')
            if (vitals) { paragraph(vitals, { size: 9, bold: true, color: '#1e293b' }) }
            if (c.anamnesis)  { paragraph(`Anamnese: ${c.anamnesis}`) }
            if (c.procedures) { paragraph(`Procedimentos: ${c.procedures}`) }
            if (c.diagnosis)  { paragraph(`Diagnóstico: ${c.diagnosis}`) }
            if (c.treatment)  { paragraph(`Tratamento: ${c.treatment}`) }
            if (c.notes)      { paragraph(`Observações: ${c.notes}`) }
            y += 3
        })
    }

    // ─── Prescriptions ──────────────────────────────────────
    sectionTitle('Receitas')
    if (!prescriptions?.length) paragraph('Nenhuma receita emitida.')
    else {
        prescriptions.forEach(p => {
            needPageBreak(30)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(BRAND_HEX)
            doc.setFontSize(10)
            doc.text(`${formatDateLong(p.issuedAt)}${p.vet?.name ? ` — Dr(a). ${p.vet.name}` : ''}`, margin, y)
            y += 6
            ;(p.items ?? []).forEach(it => {
                needPageBreak(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor('#1e293b')
                doc.setFontSize(9.5)
                doc.text(`• ${it.name}`, margin + 2, y)
                y += 4.5
                const meta = [it.dosage, it.frequency, it.duration].filter(Boolean).join(' · ')
                if (meta) {
                    doc.setTextColor('#475569')
                    doc.setFontSize(8.5)
                    doc.text(meta, margin + 6, y)
                    y += 4
                }
            })
            if (p.instructions) paragraph(`Instruções: ${p.instructions}`, { size: 9 })
            y += 3
        })
    }

    // ─── Exams ──────────────────────────────────────────────
    sectionTitle('Exames')
    if (!exams?.length) paragraph('Nenhum exame registrado.')
    else {
        exams.forEach(ex => {
            needPageBreak(18)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(BRAND_HEX)
            doc.setFontSize(10)
            doc.text(`• ${ex.type}`, margin, y)
            y += 5
            doc.setFont('helvetica', 'normal')
            doc.setTextColor('#475569')
            doc.setFontSize(9)
            doc.text(`${ex.category} · ${ex.status} · solicitado em ${formatDate(ex.requestedAt)}`, margin + 4, y)
            y += 5
            if (ex.results)    paragraph(`Resultados: ${ex.results}`, { size: 9 })
            if (ex.conclusion) paragraph(`Conclusão: ${ex.conclusion}`, { size: 9 })
            y += 2
        })
    }

    // ─── Page numbers footer ────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor('#94a3b8')
        doc.text(
            `${pet.name} · Prontuário · Página ${i} de ${pageCount}`,
            pageWidth / 2, pageHeight - 8, { align: 'center' }
        )
    }

    doc.save(`prontuario-${pet.name.toLowerCase()}-${formatDate(new Date()).replace(/\//g,'-')}.pdf`)
}
