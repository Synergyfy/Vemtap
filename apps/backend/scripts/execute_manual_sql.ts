import { Client } from 'pg';
import * as fs from 'fs';

async function executeSql() {
  const client = new Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.duowxsphkrmvdquxukdu',
    password: 'Vemtapng100',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    const currentMigrations = await client.query("SELECT * FROM migrations ORDER BY id DESC LIMIT 20");
    console.log('Recent Completed Migrations:', currentMigrations.rows.map(m => m.name));

    const tables = await client.query("SELECT n.nspname as schema, c.relname as name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'r' AND n.nspname = 'public'");
    console.log('Final Public Tables:', tables.rows.map(r => r.name).join(', '));
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

executeSql();
