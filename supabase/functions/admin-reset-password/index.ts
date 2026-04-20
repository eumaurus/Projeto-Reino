/**
 * Supabase Edge Function — admin força troca de senha de outro usuário.
 *
 * Deploy:
 *   npx supabase functions deploy admin-reset-password
 *
 * Chamar do frontend (com sessão ativa do admin):
 *   await supabase.functions.invoke('admin-reset-password', {
 *     body: { userId: 'uuid-alvo', newPassword: 'minha123' }
 *   })
 *
 * Segurança:
 *  - Valida JWT do chamador (admin.auth.getUser do token Authorization)
 *  - Lê o profile.role dele — exige 'admin'
 *  - Usa service_role_key server-side para atualizar a senha do alvo
 */

// @ts-ignore deno
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore deno
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    })

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'POST')   return json({ error: 'Method not allowed' }, 405)

    // @ts-ignore
    const supabaseUrl     = Deno.env.get('SUPABASE_URL')
    // @ts-ignore
    const serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    // @ts-ignore
    const anonKey         = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
        return json({ error: 'Server misconfigured: missing Supabase env vars.' }, 500)
    }

    // ─── Valida JWT do chamador ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
        return json({ error: 'Missing bearer token.' }, 401)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
    })
    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !callerAuth?.user) {
        return json({ error: 'Invalid token.' }, 401)
    }

    // ─── Carrega role do chamador ────────────────────────────────────
    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: callerProfile } = await admin
        .from('profiles')
        .select('role')
        .eq('id', callerAuth.user.id)
        .maybeSingle()

    if (!callerProfile || callerProfile.role !== 'admin') {
        return json({ error: 'Apenas administradores podem forçar troca de senha.' }, 403)
    }

    // ─── Body ─────────────────────────────────────────────────────────
    let body: { userId?: string; newPassword?: string }
    try {
        body = await req.json()
    } catch {
        return json({ error: 'Invalid JSON body.' }, 400)
    }

    const { userId, newPassword } = body
    if (!userId || typeof userId !== 'string') {
        return json({ error: 'userId é obrigatório.' }, 400)
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return json({ error: 'Senha precisa ter ao menos 6 caracteres.' }, 400)
    }

    // ─── Aplica a nova senha ─────────────────────────────────────────
    const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
        password: newPassword,
    })
    if (updErr) {
        return json({ error: updErr.message }, 500)
    }

    return json({ ok: true })
})
