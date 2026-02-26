import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.test
dotenv.config({ path: join(__dirname, '../.env.test') });

const dbName = process.env.DB_NAME;

if (!dbName) {
  console.error('DB_NAME is not defined.');
  process.exit(1);
}

// Warning if name doesn't imply test, but allow it if user explicitly configured it
if (!dbName.includes('test')) {
  console.warn(`WARNING: DB_NAME "${dbName}" does not contain "test". Ensure this is not a production database!`);
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

  // 2. If we are here, connection failed. Attempt to create it ONLY if it looks like a generated test name
  // We verified dbName is not null above
  if (dbName!.includes('test')) {
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
         // Fallback logic
         if (err.code === '3D000') {
             console.log(`Maintenance DB '${maintenanceDb}' not found. Trying 'neondb'...`);
             const fallbackClient = new Client({ ...baseConfig, database: 'neondb' });
             try {
                 await fallbackClient.connect();
                 await fallbackClient.query(`CREATE DATABASE "${dbName}"`);
                 console.log(`Database ${dbName} created via 'neondb'.`);
                 await fallbackClient.end();
             } catch (e) {
                 console.error('Failed to create database:', e);
                 // If creation fails, we exit.
                 process.exit(1);
             }
         } else {
             console.error('Error creating database:', err);
             process.exit(1);
         }
      } finally {
        await client.end().catch(() => {});
      }
  } else {
      // If not a "test" named DB, we don't try to create it automatically to avoid permission issues or accidents.
      // We just report the connection failure.
      console.error(`Could not connect to database "${dbName}" and auto-creation is disabled for non-test names.`);
      process.exit(1);
  }
}

createDb();
