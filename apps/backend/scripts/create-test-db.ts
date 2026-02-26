import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.test
dotenv.config({ path: join(__dirname, '../.env.test') });

const dbName = process.env.DB_NAME;

if (!dbName || !dbName.includes('test')) {
  console.error('DB_NAME must include "test" in name to prevent accidental production drops.');
  process.exit(1);
}

const baseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function createDb() {
  // 1. Try connecting to the target test database to see if it exists
  const targetClient = new Client({
    ...baseConfig,
    database: dbName,
  });

  try {
    await targetClient.connect();
    console.log(`Database ${dbName} already exists.`);
    await targetClient.end();
    return;
  } catch (err: any) {
    if (err.code !== '3D000') { // 3D000 is "database does not exist"
      console.error(`Error connecting to ${dbName}:`, err);
      process.exit(1);
    }
    // Database does not exist, proceed to create it.
  }

  // 2. Connect to maintenance database ('postgres') to create the new DB
  const maintenanceDb = 'postgres';
  const client = new Client({
    ...baseConfig,
    database: maintenanceDb,
  });

  try {
    await client.connect();
    console.log(`Connected to maintenance database '${maintenanceDb}'. Creating ${dbName}...`);
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database ${dbName} created.`);
  } catch (err: any) {
     // If 'postgres' db doesn't exist (unlikely but possible in some setups), try 'neondb'
     if (err.code === '3D000') {
         console.log(`Maintenance DB '${maintenanceDb}' not found. Trying 'neondb'...`);
         const fallbackClient = new Client({ ...baseConfig, database: 'neondb' });
         try {
             await fallbackClient.connect();
             await fallbackClient.query(`CREATE DATABASE "${dbName}"`);
             console.log(`Database ${dbName} created via 'neondb'.`);
             await fallbackClient.end();
         } catch (e) {
             console.error('Failed to connect to fallback maintenance DB:', e);
             process.exit(1);
         }
     } else {
         console.error('Error creating database:', err);
         process.exit(1);
     }
  } finally {
    await client.end().catch(() => {});
  }
}

createDb();
