import pg from 'pg'

const local = new pg.Client('postgresql://postgres:postgres@127.0.0.1:54322/postgres')
const cloud = new pg.Client({
    host:     'db.wvycmrdgvkpxmnzouiya.supabase.co',
    port:     5432,
    database: 'postgres',
    user:     'postgres',
    password: process.env.DB_PASSWORD,
    ssl:      { rejectUnauthorized: false },
})

const TABLES = [
    { schema: 'auth',   name: 'users',         pkCols: ['id'] },
    { schema: 'auth',   name: 'identities',    pkCols: ['id'] },
    { schema: 'public', name: 'services',      pkCols: ['id'] },
    { schema: 'public', name: 'profiles',      pkCols: ['id'] },
    { schema: 'public', name: 'pets',          pkCols: ['id'] },
    { schema: 'public', name: 'bookings',      pkCols: ['id'] },
    { schema: 'public', name: 'consultations', pkCols: ['id'] },
    { schema: 'public', name: 'prescriptions', pkCols: ['id'] },
    { schema: 'public', name: 'exams',         pkCols: ['id'] },
    { schema: 'public', name: 'notifications', pkCols: ['id'] },
]

async function getColumns(client, schema, table) {
    const r = await client.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
           AND is_generated = 'NEVER'
         ORDER BY ordinal_position`,
        [schema, table]
    )
    return r.rows
}

function serializeValue(value, dataType) {
    if (value === null || value === undefined) return null
    if ((dataType === 'json' || dataType === 'jsonb') && typeof value !== 'string') {
        return JSON.stringify(value)
    }
    return value
}

async function copyTable({ schema, name, pkCols }) {
    const qualified = `${schema}."${name}"`
    const localCols = await getColumns(local, schema, name)
    const cloudCols = await getColumns(cloud, schema, name)
    const cloudColNames = new Set(cloudCols.map(c => c.column_name))
    const cols = localCols.filter(c => cloudColNames.has(c.column_name))

    const { rows } = await local.query(`SELECT ${cols.map(c => `"${c.column_name}"`).join(', ')} FROM ${qualified}`)
    if (rows.length === 0) {
        console.log(`  ${qualified}: 0 rows (skip)`)
        return
    }

    const colList = cols.map(c => `"${c.column_name}"`).join(', ')
    const conflictClause = pkCols.length
        ? `ON CONFLICT (${pkCols.map(c => `"${c}"`).join(', ')}) DO NOTHING`
        : ''

    let inserted = 0
    for (const row of rows) {
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
        const values = cols.map(c => serializeValue(row[c.column_name], c.data_type))
        const sql = `INSERT INTO ${qualified} (${colList}) VALUES (${placeholders}) ${conflictClause}`
        try {
            const res = await cloud.query(sql, values)
            inserted += res.rowCount
        } catch (err) {
            console.error(`    ✖ row error on ${qualified}: ${err.message}`)
            throw err
        }
    }
    console.log(`  ${qualified}: ${inserted}/${rows.length} inserted`)
}

try {
    await local.connect()
    await cloud.connect()
    console.log('✅ Connected to both DBs\n')

    // Disable triggers (e.g. handle_new_user on auth.users) for the migration session
    await cloud.query('SET session_replication_role = replica')
    console.log('🔕 Triggers disabled on cloud session\n')

    console.log('📦 Copying tables:\n')
    for (const t of TABLES) {
        await copyTable(t)
    }

    await cloud.query('SET session_replication_role = DEFAULT')
    console.log('\n🔔 Triggers re-enabled')
    console.log('\n✅ Migration complete')
} catch (err) {
    console.error('\n❌ FAILED:', err.message)
    process.exitCode = 1
} finally {
    await local.end()
    await cloud.end()
}
