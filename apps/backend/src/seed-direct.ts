/* eslint-disable @typescript-eslint/no-var-requires */
// Minimal direct-DB seed — no NestJS, no Redis. Run: npx ts-node src/seed-direct.ts
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });


const accounts = [
    { firstName: 'Super', lastName: 'Admin', email: 'admin@latap.com', password: 'admin123', role: 'Admin' },
    { firstName: 'John', lastName: 'Smith', email: 'business@latap.com', password: 'business123', role: 'Owner' },
    { firstName: 'Sarah', lastName: 'Supervisor', email: 'manager@latap.com', password: 'manager123', role: 'Manager' },
    { firstName: 'Michael', lastName: 'Cashier', email: 'staff@latap.com', password: 'staff123', role: 'Staff' },
    { firstName: 'Jane', lastName: 'Customer', email: 'customer@latap.com', password: 'customer123', role: 'Customer' },
];

async function seed() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    console.log('✅ Connected to Neon Postgres\n');

    for (const acc of accounts) {
        const exists = await client.query('SELECT id FROM users WHERE email = $1', [acc.email]);
        if (exists.rows.length > 0) {
            console.log(`⏭  Already exists: ${acc.email}`);
            continue;
        }
        const hash = await bcrypt.hash(acc.password, 10);
        const id = crypto.randomUUID();
        await client.query(
            `INSERT INTO users (id, "firstName", "lastName", email, password, role, status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'Active', NOW(), NOW())`,
            [id, acc.firstName, acc.lastName, acc.email, hash, acc.role]
        );
        console.log(`✅ Created ${acc.role}: ${acc.email} / ${acc.password}`);
    }

    await client.end();
    console.log('\n🎉 Seeding complete!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
