import { jsPDF } from 'jspdf'
import { CLINIC } from '../../constants/clinic'
import { formatDate, formatDateLong } from '../dates'

const BRAND_HEX = '#505273'
const PRIMARY_HEX = '#73c6e8'

export function generatePrescriptionPdf({ prescription, pet, owner }) {
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth  = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 18

    // ─── Header banner ──────────────────────────────────────
    doc.setFillColor(PRIMARY_HEX)
    doc.rect(0, 0, pageWidth, 36, 'F')
    doc.setTextColor('#ffffff')
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Reino Animal', margin, 17)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Clínica Veterinária · Cuidado excepcional e personalizado', margin, 24)
    doc.setFontSize(9)
    doc.text(CLINIC.address, margin, 30)

    // ─── Title ──────────────────────────────────────────────
    doc.setTextColor(BRAND_HEX)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('Receituário Veterinário', margin, 52)

    doc.setDrawColor(PRIMARY_HEX)
    doc.setLineWidth(0.6)
    doc.line(margin, 55, pageWidth - margin, 55)

    let y = 64
    const label = (text, value) => {
        doc.setFontSize(8)
        doc.setTextColor('#94a3b8')
        doc.setFont('helvetica', 'bold')
        doc.text(text.toUpperCase(), margin, y)
        y += 4
        doc.setFontSize(11)
        doc.setTextColor('#1e293b')
        doc.setFont('helvetica', 'normal')
        doc.text(String(value ?? '—'), margin, y)
        y += 8
    }

    const twoCol = (l1, v1, l2, v2) => {
        const mid = pageWidth / 2
        doc.setFontSize(8)
        doc.setTextColor('#94a3b8')
        doc.setFont('helvetica', 'bold')
        doc.text(l1.toUpperCase(), margin, y)
        doc.text(l2.toUpperCase(), mid, y)
        y += 4
        doc.setFontSize(11)
        doc.setTextColor('#1e293b')
        doc.setFont('helvetica', 'normal')
        doc.text(String(v1 ?? '—'), margin, y)
        doc.text(String(v2 ?? '—'), mid, y)
        y += 8
    }

    // ─── Patient/Owner block ─────────────────────────────────
    twoCol('Tutor', owner?.name, 'Telefone', owner?.phone ?? '—')
    twoCol('Pet',   pet?.name,    'Espécie', `${pet?.species ?? '—'}${pet?.breed ? ` / ${pet.breed}` : ''}`)
    twoCol('Idade', pet?.age ?? '—', 'Peso', pet?.weight ?? '—')
    label('Data de emissão', formatDateLong(prescription.issuedAt))

    // ─── Medications ────────────────────────────────────────
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND_HEX)
    doc.text('Prescrição', margin, y + 2)
    y += 8

    const items = prescription.items ?? []
    items.forEach((item, idx) => {
        if (y > pageHeight - 60) { doc.addPage(); y = 20 }

        doc.setFillColor('#f8fafc')
        doc.setDrawColor('#e2e8f0')
        doc.setLineWidth(0.2)
        const boxY = y
        doc.roundedRect(margin, boxY, pageWidth - margin * 2, 22, 2, 2, 'FD')

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor('#1e293b')
        doc.text(`${idx + 1}. ${item.name}`, margin + 3, boxY + 7)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#475569')
        const parts = []
        if (item.dosage)     parts.push(`Dose: ${item.dosage}`)
        if (item.frequency)  parts.push(`Frequência: ${item.frequency}`)
        if (item.duration)   parts.push(`Duração: ${item.duration}`)
        doc.text(parts.join('  ·  ') || '—', margin + 3, boxY + 13)

        if (item.notes) {
            doc.setTextColor('#64748b')
            doc.setFontSize(8.5)
            const lines = doc.splitTextToSize(item.notes, pageWidth - margin * 2 - 6)
            doc.text(lines, margin + 3, boxY + 18)
        }
        y = boxY + 26
    })

    // ─── Instructions ───────────────────────────────────────
    if (prescription.instructions) {
        if (y > pageHeight - 50) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(BRAND_HEX)
        doc.text('Instruções gerais', margin, y)
        y += 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor('#334155')
        const lines = doc.splitTextToSize(prescription.instructions, pageWidth - margin * 2)
        doc.text(lines, margin, y)
        y += lines.length * 5 + 6
    }

    if (prescription.validUntil) {
        doc.setFontSize(9)
        doc.setTextColor('#64748b')
        doc.text(`Validade: ${formatDate(prescription.validUntil)}`, margin, y)
        y += 8
    }

    // ─── Signature ─────────────────────────────────────────
    const sigY = Math.max(y + 20, pageHeight - 50)
    doc.setDrawColor('#94a3b8')
    doc.setLineWidth(0.4)
    doc.line(margin + 20, sigY, pageWidth - margin - 20, sigY)
    doc.setFontSize(10)
    doc.setTextColor('#1e293b')
    doc.setFont('helvetica', 'bold')
    const vetName = prescription.vet?.name ?? ''
    const vetCrmv = prescription.vet?.crmv ? `CRMV-SP ${prescription.vet.crmv}` : ''
    doc.text(vetName, pageWidth / 2, sigY + 5, { align: 'center' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#475569')
    doc.text(vetCrmv, pageWidth / 2, sigY + 10, { align: 'center' })

    // ─── Footer ────────────────────────────────────────────
    doc.setFontSize(8)
    doc.setTextColor('#94a3b8')
    doc.text(
        `${CLINIC.name} · ${CLINIC.phone} · ${CLINIC.whatsapp}`,
        pageWidth / 2, pageHeight - 8, { align: 'center' }
    )

    return doc
}

export function downloadPrescriptionPdf(args) {
    const doc = generatePrescriptionPdf(args)
    const filename = `receita-${args.pet?.name ?? 'pet'}-${formatDate(args.prescription.issuedAt).replace(/\//g, '-')}.pdf`
    doc.save(filename)
}

export function previewPrescriptionPdf(args) {
    const doc = generatePrescriptionPdf(args)
    const blob = doc.output('bloburl')
    window.open(blob, '_blank')
}
