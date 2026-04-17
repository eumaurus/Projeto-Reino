import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.VITE_SUPABASE_URL
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey || serviceKey === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ Preencha VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env antes de rodar o seed.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

const users = [
    {
        email: 'admin@reinoanimal.com',
        password: 'admin123',
        user_metadata: {
            name:     'Admin Reino Animal',
            document: '00000000000100',
            phone:    '(11) 90000-0000',
            role:     'admin'
        }
    },
    {
        email: 'vet@reinoanimal.com',
        password: 'vet12345',
        user_metadata: {
            name:     'Veterinário de Teste',
            document: '33333333333',
            phone:    '(11) 91111-1111',
            role:     'vet'
        }
    },
    {
        email: 'joao@example.com',
        password: 'joao1234',
        user_metadata: {
            name:     'João Silva',
            document: '11111111111',
            phone:    '(11) 98888-7777',
            role:     'client'
        }
    }
]

console.log('🌱 Criando usuários de teste...\n')

for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
        email:          user.email,
        password:       user.password,
        email_confirm:  true,
        user_metadata:  user.user_metadata
    })

    if (error) {
        if (error.message.toLowerCase().includes('already been registered') ||
            error.message.toLowerCase().includes('already exists')) {
            console.log(`⚠️  ${user.email} já existe, pulando.`)
        } else {
            console.error(`❌ Erro ao criar ${user.email}: ${error.message}`)
        }
    } else {
        console.log(`✅ ${user.email}  |  role: ${user.user_metadata.role}  |  senha: ${user.password}`)
    }
}

console.log('\n✔ Seed concluído.')
