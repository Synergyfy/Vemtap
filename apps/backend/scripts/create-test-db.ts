import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.test
dotenv.config({ path: join(__dirname, '../.env.test'), override: true });

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
  const maintenanceDb = 'postgres';
  const maintenanceClient = new Client({
    ...baseConfig,
    database: maintenanceDb,
  });

  try {
    await maintenanceClient.connect();

    // Check if DB exists
    const checkRes = await maintenanceClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName],
    );

    if (checkRes.rowCount && checkRes.rowCount > 0) {
      console.log(`Terminating existing connections to ${dbName}...`);
      await maintenanceClient.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = $1
           AND pid <> pg_backend_pid()`,
        [dbName],
      );
      console.log(`Connections to ${dbName} terminated.`);
    } else if (dbName!.includes('test')) {
      console.log(`Creating database ${dbName}...`);
      await maintenanceClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created.`);
    } else {
      console.error(
        `Could not connect to database "${dbName}" and auto-creation is disabled for non-test names.`,
      );
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Error managing database:', err.message ?? err);
    process.exit(1);
  } finally {
    await maintenanceClient.end().catch(() => {});
  }
}

createDb();
