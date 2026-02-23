const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Hardcoded from .env (Neon Postgres)
const DB_CONFIG = {
    host: 'ep-proud-resonance-ai7nu2o2-pooler.c-4.us-east-1.aws.neon.tech',
    port: 5432,
    user: 'neondb_owner',
    password: 'npg_wvh5gMYp6oFk',
    database: 'neondb',
    ssl: { rejectUnauthorized: false }
};

const accounts = [
    { firstName: 'Super', lastName: 'Admin', email: 'admin@latap.com', password: 'admin123', role: 'Admin' },
    { firstName: 'John', lastName: 'Smith', email: 'business@latap.com', password: 'business123', role: 'Owner' },
    { firstName: 'Sarah', lastName: 'Supervisor', email: 'manager@latap.com', password: 'manager123', role: 'Manager' },
    { firstName: 'Michael', lastName: 'Cashier', email: 'staff@latap.com', password: 'staff123', role: 'Staff' },
    { firstName: 'Jane', lastName: 'Customer', email: 'customer@latap.com', password: 'customer123', role: 'Customer' },
];

async function run() {
    const client = new Client(DB_CONFIG);
    await client.connect();
    console.log('Connected to Neon DB\n');

    // Check existing users first
    const existing = await client.query('SELECT email, role, status FROM users LIMIT 20');
    if (existing.rows.length > 0) {
        console.log('=== Existing Users ===');
        existing.rows.forEach(u => console.log(' [' + u.role + '] ' + u.email + ' (' + u.status + ')'));
        console.log('');
    }

    // Create missing accounts
    for (const acc of accounts) {
        const check = await client.query('SELECT id FROM users WHERE email = $1', [acc.email]);
        if (check.rows.length > 0) {
            console.log('Already exists: ' + acc.email);
            continue;
        }
        const hash = await bcrypt.hash(acc.password, 10);
        const id = crypto.randomUUID();
        await client.query(
            'INSERT INTO users (id, "firstName", "lastName", email, password, role, status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
            [id, acc.firstName, acc.lastName, acc.email, hash, acc.role, 'Active']
        );
        console.log('Created: [' + acc.role + '] ' + acc.email + ' / ' + acc.password);
    }

    console.log('\nDone!');
    await client.end();
    process.exit(0);
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
