/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false },
    });
    await client.connect();
    const result = await client.query(
        `SELECT "firstName", "lastName", email, role, status FROM users ORDER BY "createdAt" DESC LIMIT 10`
    );
    console.log('\n=== Users in DB ===');
    result.rows.forEach((u: any) => {
        console.log(`  [${u.role}] ${u.firstName} ${u.lastName} — ${u.email} (${u.status})`);
    });
    console.log(`\nTotal: ${result.rowCount} rows shown`);
    await client.end();
    process.exit(0);
}
check().catch((e) => { console.error(e.message); process.exit(1); });
