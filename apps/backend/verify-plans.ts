import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function verifyPlans() {
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
    console.log('--- Verifying Subscription Plans ---');
    const planRes = await client.query('SELECT name, "monthlyPrice", isFree, isActive FROM plans ORDER BY "monthlyPrice" ASC');
    console.table(planRes.rows);

    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

verifyPlans();
