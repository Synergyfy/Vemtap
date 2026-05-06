import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

async function checkEnv(envFile: string) {
  dotenv.config({ path: join(__dirname, '../../../../../../../../../../', 'vemtap-workspace/apps/backend', envFile), override: true });
  
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await ds.initialize();
  const nullCount = await ds.query('SELECT COUNT(*) FROM branches WHERE username IS NULL');
  const totalCount = await ds.query('SELECT COUNT(*) FROM branches');
  console.log(`${envFile} - Total Branches: ${totalCount[0].count}, NULL Usernames: ${nullCount[0].count}`);
  await ds.destroy();
}

async function run() {
  try {
    await checkEnv('.env.staging');
    await checkEnv('.env.prod');
  } catch (e) {
    console.error(e);
  }
}

run();
