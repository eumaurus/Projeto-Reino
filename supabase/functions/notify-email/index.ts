/**
 * Supabase Edge Function — envia e-mail transacional via Resend.
 *
 * Deploy:
 *   npx supabase functions deploy notify-email --no-verify-jwt
 *   npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
 *   npx supabase secrets set RESEND_FROM="Reino Animal <contato@reinoanimal.com>"
 *
 * Chamar do frontend:
 *   await supabase.functions.invoke('notify-email', {
 *     body: { to, subject, html }
 *   })
 *
 * Free tier Resend: 100 e-mails/dia, 3.000/mês.
 */

// @ts-ignore deno
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

    // @ts-ignore
    const apiKey = Deno.env.get('RESEND_API_KEY')
    // @ts-ignore
    const from   = Deno.env.get('RESEND_FROM') ?? 'Reino Animal <onboarding@resend.dev>'

    if (!apiKey) {
        return json({ ok: false, error: 'RESEND_API_KEY não configurado' }, 500)
    }

    try {
        const { to, subject, html, text } = await req.json()
        if (!to || !subject || (!html && !text)) {
            return json({ ok: false, error: 'Campos obrigatórios: to, subject, html|text' }, 400)
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type':  'application/json',
            },
            body: JSON.stringify({ from, to, subject, html, text }),
        })

        const data = await res.json()
        if (!res.ok) return json({ ok: false, error: data }, res.status)
        return json({ ok: true, id: data.id })
    } catch (e) {
        return json({ ok: false, error: String(e) }, 500)
    }
})

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    })
}
