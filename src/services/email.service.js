import { supabase } from './supabase'
import { CLINIC } from '../shared/constants/clinic'
import { formatDateLong, formatDate } from '../shared/utils/dates'

/**
 * Dispara um e-mail via Edge Function `notify-email` (Resend).
 * Requer configuração de RESEND_API_KEY no Supabase:
 *   npx supabase secrets set RESEND_API_KEY=re_xxxx
 *   npx supabase functions deploy notify-email --no-verify-jwt
 */
export const sendEmail = async ({ to, subject, html, text }) => {
    const { data, error } = await supabase.functions.invoke('notify-email', {
        body: { to, subject, html, text },
    })
    if (error || !data?.ok) {
        return { ok: false, error: error?.message ?? data?.error ?? 'Falha ao enviar e-mail' }
    }
    return { ok: true, id: data.id }
}

const wrapLayout = (title, bodyHtml) => `
<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1e293b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr><td align="center">
            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                <tr><td style="background:linear-gradient(135deg,#73c6e8,#505273);padding:28px 32px;color:white;">
                    <h1 style="margin:0;font-size:22px;">Reino Animal</h1>
                    <p style="margin:4px 0 0;opacity:0.85;font-size:13px;">Cuidado excepcional e personalizado</p>
                </td></tr>
                <tr><td style="padding:32px;">
                    <h2 style="margin:0 0 16px;color:#505273;font-size:18px;">${title}</h2>
                    ${bodyHtml}
                </td></tr>
                <tr><td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
                    ${CLINIC.address}<br>
                    ${CLINIC.phone} · ${CLINIC.whatsapp}
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`

export const sendBookingConfirmedEmail = ({ to, ownerName, petName, service, date, time }) =>
    sendEmail({
        to, subject: `Seu agendamento foi confirmado!`,
        html: wrapLayout('Agendamento confirmado ✅', `
            <p>Olá, <strong>${ownerName}</strong>!</p>
            <p>Seu agendamento foi confirmado pela nossa equipe.</p>
            <table style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;width:100%;font-size:14px;">
                <tr><td><strong>Pet:</strong></td><td>${petName}</td></tr>
                <tr><td><strong>Serviço:</strong></td><td>${service}</td></tr>
                <tr><td><strong>Data:</strong></td><td>${formatDateLong(date)}</td></tr>
                <tr><td><strong>Horário:</strong></td><td>${time}</td></tr>
            </table>
            <p style="color:#64748b;font-size:13px;">Esperamos vocês! Qualquer imprevisto, entre em contato pelo WhatsApp ${CLINIC.whatsapp}.</p>
        `),
    })

export const sendPrescriptionEmail = ({ to, ownerName, petName, issuedAt }) =>
    sendEmail({
        to, subject: `Nova receita disponível para ${petName}`,
        html: wrapLayout('Nova receita emitida 💊', `
            <p>Olá, <strong>${ownerName}</strong>.</p>
            <p>Uma receita foi emitida para <strong>${petName}</strong> em ${formatDate(issuedAt)}.</p>
            <p>Acesse o portal para visualizar e baixar em PDF.</p>
        `),
    })

export const sendVaccineReminderEmail = ({ to, ownerName, petName, vaccineName, dueDate }) =>
    sendEmail({
        to, subject: `Lembrete: vacina de ${petName} vence em breve`,
        html: wrapLayout('Lembrete de vacina 💉', `
            <p>Olá, <strong>${ownerName}</strong>.</p>
            <p>A vacina <strong>${vaccineName}</strong> de <strong>${petName}</strong> está prevista para <strong>${formatDate(dueDate)}</strong>.</p>
            <p>Agende o reforço pelo portal ou pelo WhatsApp.</p>
        `),
    })
