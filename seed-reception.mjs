import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey || serviceKey === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ Preencha VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Conta de recepção padrão ──────────────────────────────
const user = {
    email:    'recepcao@reinoanimal.com',
    password: 'reino123',
    meta: {
        name:     'Recepção Reino Animal',
        document: '99999999999',
        phone:    '(11) 4198-4301',
        role:     'reception',
    },
}

console.log('🪑 Criando conta de recepção...\n')

const { data: existing } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', user.email)
    .maybeSingle()

if (existing) {
    console.log(`ℹ️  Conta já existe (id=${existing.id}). Garantindo role=reception...`)
    const { error: updErr } = await supabase
        .from('profiles')
        .update({ role: 'reception' })
        .eq('id', existing.id)
    if (updErr) {
        console.error('❌ Falha ao atualizar role:', updErr.message)
        process.exit(1)
    }
    console.log('✅ Role garantida como "reception".')
} else {
    const { data, error } = await supabase.auth.admin.createUser({
        email:         user.email,
        password:      user.password,
        email_confirm: true,
        user_metadata: user.meta,
    })
    if (error) {
        console.error('❌ Falha ao criar usuário:', error.message)
        process.exit(1)
    }

    // O trigger on_auth_user_created cria o profile; garantimos role reception
    await supabase
        .from('profiles')
        .update({ role: 'reception' })
        .eq('id', data.user.id)

    console.log('✅ Conta criada:')
}

console.log(`\n   📧 E-mail: ${user.email}`)
console.log(`   🔑 Senha:  ${user.password}`)
console.log(`   👤 Nome:   ${user.meta.name}`)
console.log(`   🎭 Papel:  reception`)
console.log('\n   Acesse /login e entre com essas credenciais.')
