import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey || serviceKey === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    console.error('❌ Preencha VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env (.env.docker).')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ───────────────────────────────────────────────
const users = [
    {
        email: 'admin@reinoanimal.com', password: 'admin123',
        meta: { name: 'Renata Chaves',   document: '00000000000100', phone: '(11) 4198-4301', role: 'admin', crmv: '14.348' },
    },
    {
        email: 'vet@reinoanimal.com',   password: 'vet12345',
        meta: { name: 'Renato T. Maurus', document: '33333333333',   phone: '(11) 91111-1111', role: 'vet',   crmv: '13.284' },
    },
    {
        email: 'joao@example.com',      password: 'joao1234',
        meta: { name: 'João Silva',      document: '11111111111',    phone: '(11) 98888-7777', role: 'client' },
    },
]

console.log('🌱 Criando usuários de teste...\n')

const created = {}
for (const u of users) {
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', u.email)
        .maybeSingle()

    if (existing) {
        created[u.email] = existing.id
        console.log(`⚠️  ${u.email} já existe, reaproveitando.`)
        continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email:         u.email,
        password:      u.password,
        email_confirm: true,
        user_metadata: u.meta,
    })
    if (error) {
        console.error(`❌ ${u.email}: ${error.message}`)
        continue
    }
    created[u.email] = data.user.id

    if (u.meta.crmv) {
        await supabase.from('profiles').update({ crmv: u.meta.crmv }).eq('id', data.user.id)
    }
    console.log(`✅ ${u.email}  |  role: ${u.meta.role}`)
}

const clientId = created['joao@example.com']
const vetId    = created['vet@reinoanimal.com']

if (!clientId || !vetId) {
    console.log('\n✔ Seed concluído (sem dados demo - usuários faltando).')
    process.exit(0)
}

// ─── Pets (demo) ───────────────────────────────────────────
const todayISO    = () => new Date().toISOString().slice(0, 10)
const daysAgoISO  = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const daysAheadISO= (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const demoPets = [
    {
        id: '10001',
        owner_id: clientId,
        name: 'Thor',
        species: 'Cachorro',
        breed: 'Labrador',
        age: '4 anos',
        weight: '28 kg',
        birth_date: '2022-03-15',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80',
        notes: 'Pet tranquilo, adora biscoitos. Sem alergias conhecidas.',
        vaccines: [
            { name: 'V10 (Décupla)',       date: daysAgoISO(60),  nextDue: daysAheadISO(305), vet: 'Renata Chaves', status: 'applied' },
            { name: 'Antirrábica',          date: daysAgoISO(90),  nextDue: daysAheadISO(275), vet: 'Renata Chaves', status: 'applied' },
            { name: 'Leptospirose',         date: daysAgoISO(60),  nextDue: daysAheadISO(120), vet: 'Renata Chaves', status: 'applied' },
            { name: 'Gripe canina (Injetável)', date: daysAgoISO(365), nextDue: daysAgoISO(5),  vet: 'Renata Chaves', status: 'applied' },
        ],
    },
    {
        id: '10002',
        owner_id: clientId,
        name: 'Mimi',
        species: 'Gato',
        breed: 'SRD',
        age: '2 anos',
        weight: '4 kg',
        birth_date: '2024-05-01',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500&q=80',
        notes: 'Gatinha dócil, gosta de carinho. Reagiu bem a todas as vacinas.',
        vaccines: [
            { name: 'V4 (Quádrupla Felina)', date: daysAgoISO(100), nextDue: daysAheadISO(265), vet: 'Renata Chaves', status: 'applied' },
            { name: 'Antirrábica Felina',    date: daysAgoISO(100), nextDue: daysAheadISO(265), vet: 'Renata Chaves', status: 'applied' },
        ],
    },
]

console.log('\n🐾 Criando pets demo...\n')
for (const pet of demoPets) {
    const { error } = await supabase.from('pets').upsert(pet, { onConflict: 'id' })
    if (error) console.error(`❌ ${pet.name}: ${error.message}`)
    else console.log(`✅ ${pet.name} (#${pet.id})`)
}

// ─── Consultations demo ────────────────────────────────────
console.log('\n📋 Criando consultas demo...\n')
const { error: errC1 } = await supabase.from('consultations').insert([
    {
        pet_id:      '10001',
        owner_id:    clientId,
        vet_id:      vetId,
        consulted_at: daysAgoISO(60) + 'T10:30:00Z',
        reason:      'Rotina anual + vacinação',
        anamnesis:   'Tutor relata pet ativo, comendo bem. Sem queixas no momento.',
        procedures:  'Exame físico geral, aferição de sinais vitais, aplicação de V10 e Leptospirose.',
        diagnosis:   'Animal saudável.',
        treatment:   'Manter dieta atual. Retorno em 6 meses para reforço.',
        weight_kg:   28.0,
        temperature_c: 38.5,
        heart_rate:  110,
    },
])
if (errC1) console.error('❌ Consulta Thor:', errC1.message)
else console.log('✅ Consulta de Thor (rotina)')

const { error: errC2 } = await supabase.from('consultations').insert([
    {
        pet_id:      '10002',
        owner_id:    clientId,
        vet_id:      vetId,
        consulted_at: daysAgoISO(100) + 'T14:00:00Z',
        reason:      'Primeira consulta e protocolo vacinal',
        anamnesis:   'Tutor adotou gatinha há 2 meses. Sem histórico prévio.',
        procedures:  'Exame físico, vermifugação, início do protocolo vacinal (V4 e antirrábica).',
        diagnosis:   'Felino jovem saudável, em ótimo estado geral.',
        treatment:   'Reforço V4 em 30 dias. Manter alimentação premium recomendada.',
        weight_kg:   3.8,
        temperature_c: 38.7,
    },
])
if (errC2) console.error('❌ Consulta Mimi:', errC2.message)
else console.log('✅ Consulta de Mimi (primeira visita)')

// ─── Prescriptions demo ────────────────────────────────────
console.log('\n💊 Criando receitas demo...\n')
const { error: errRx } = await supabase.from('prescriptions').insert([
    {
        pet_id:   '10001',
        owner_id: clientId,
        vet_id:   vetId,
        issued_at: daysAgoISO(60) + 'T11:00:00Z',
        items: [
            { name: 'Vermífugo oral', dosage: '1 comprimido', frequency: 'dose única', duration: '—', notes: 'Administrar com alimento.' },
            { name: 'Antipulgas tópico', dosage: '1 pipeta', frequency: 'mensal', duration: '3 meses', notes: 'Aplicar na nuca.' },
        ],
        instructions: 'Manter o cronograma mensal. Retorno se surgir qualquer sintoma.',
        valid_until: daysAheadISO(30),
    },
])
if (errRx) console.error('❌ Receita:', errRx.message)
else console.log('✅ Receita de Thor (2 itens)')

// ─── Exams demo ───────────────────────────────────────────
console.log('\n🔬 Criando exames demo...\n')
const { error: errEx } = await supabase.from('exams').insert([
    {
        pet_id:   '10001',
        owner_id: clientId,
        vet_id:   vetId,
        type:     'Hemograma completo',
        category: 'laboratorial',
        status:   'completed',
        requested_at: daysAgoISO(60),
        completed_at: daysAgoISO(58) + 'T09:00:00Z',
        results:  'Parâmetros normais. Hematócrito, leucócitos, plaquetas todos dentro da referência.',
        conclusion: 'Sem alterações dignas de nota. Animal saudável.',
    },
    {
        pet_id:   '10002',
        owner_id: clientId,
        vet_id:   vetId,
        type:     'Parasitológico de fezes',
        category: 'laboratorial',
        status:   'requested',
        requested_at: daysAgoISO(2),
    },
])
if (errEx) console.error('❌ Exames:', errEx.message)
else console.log('✅ 2 exames (1 concluído, 1 solicitado)')

// ─── Bookings demo ────────────────────────────────────────
console.log('\n📅 Criando agendamentos demo...\n')
const { error: errB } = await supabase.from('bookings').insert([
    {
        owner_id:       clientId,
        pet_id:         '10001',
        service:        'Consulta Clínica',
        vaccines:       [],
        requested_date: daysAheadISO(3),
        requested_time: '10:00',
        status:         'pending',
        notes:          'Avaliação de retorno pós-tratamento de otite.',
    },
    {
        owner_id:       clientId,
        pet_id:         '10002',
        service:        'Vacinação',
        vaccines:       [{ id: 'v4', name: 'V4 (Quádrupla Felina)' }],
        requested_date: daysAheadISO(7),
        requested_time: '14:30',
        status:         'confirmed',
        confirmed_at:   new Date().toISOString(),
    },
    {
        owner_id:       clientId,
        pet_id:         '10001',
        service:        'Banho & Tosa',
        vaccines:       [],
        requested_date: daysAgoISO(10),
        requested_time: '09:00',
        status:         'done',
    },
])
if (errB) console.error('❌ Agendamentos:', errB.message)
else console.log('✅ 3 agendamentos criados')

console.log('\n════════════════════════════════════════════════════════')
console.log('✔ Seed concluído com sucesso!')
console.log('════════════════════════════════════════════════════════\n')
console.log('  📧 admin@reinoanimal.com  /  admin123   (admin)')
console.log('  📧 vet@reinoanimal.com    /  vet12345   (veterinário)')
console.log('  📧 joao@example.com       /  joao1234   (tutor, com 2 pets e dados demo)')
console.log()
