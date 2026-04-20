import pg from 'pg'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const { Client } = pg

// Lê host do projeto a partir de setup-db.mjs (mantém consistência)
const client = new Client({
    host:     'db.wvycmrdgvkpxmnzouiya.supabase.co',
    port:     5432,
    database: 'postgres',
    user:     'postgres',
    password: process.env.DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
})

if (!process.env.DB_PASSWORD) {
    console.error('❌ DB_PASSWORD não definida. Rode com `node --env-file=.env apply-migrations.mjs`.')
    process.exit(1)
}

const MIGRATIONS_DIR = 'supabase/migrations'

// Aceita argumentos: se vazio, aplica TODAS; senão aplica só as que contêm o padrão
const filter = process.argv.slice(2)

const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .filter(f => filter.length === 0 || filter.some(p => f.includes(p)))
    .sort()

if (files.length === 0) {
    console.log('ℹ️  Nenhuma migration encontrada com esse filtro.')
    process.exit(0)
}

console.log(`🔌 Conectando em ${client.host}...`)
await client.connect()
console.log('✅ Conectado.\n')

for (const file of files) {
    const path = join(MIGRATIONS_DIR, file)
    const sql  = readFileSync(path, 'utf8')
    process.stdout.write(`➤ Aplicando ${file}... `)
    try {
        await client.query(sql)
        console.log('✅')
    } catch (err) {
        console.log('❌')
        console.error(`   ${err.message}`)
        // Não sai — tenta as próximas (muitas são idempotentes via IF NOT EXISTS)
    }
}

await client.end()
console.log('\n🎉 Migrations aplicadas. Tente criar a conta de recepção agora.')
