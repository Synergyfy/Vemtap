import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verifySeeding() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('--- Verifying Categories ---');
    const catRes = await client.query('SELECT name FROM categories ORDER BY name ASC');
    console.log('Categories found:', catRes.rows.map(r => r.name).join(', '));

    console.log('\n--- Verifying Subcategories (sample) ---');
    const subRes = await client.query('SELECT name FROM subcategories ORDER BY name ASC LIMIT 10');
    console.log('Subcategories found (sample):', subRes.rows.map(r => r.name).join(', '));

    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

verifySeeding();
