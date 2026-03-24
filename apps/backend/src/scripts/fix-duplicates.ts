import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function findUniquePhone(
  table: string,
  originalPhone: string,
): Promise<string> {
  let currentPhone = originalPhone;
  let suffix = 1;

  while (true) {
    // Simple logic: try to change the last digit or append if too short
    const lastDigit = parseInt(currentPhone.slice(-1));
    if (!isNaN(lastDigit)) {
      currentPhone = currentPhone.slice(0, -1) + ((lastDigit + 1) % 10);
    } else {
      currentPhone = currentPhone + suffix;
    }

    const existing = await AppDataSource.query(
      `SELECT id FROM ${table} WHERE phone = $1`,
      [currentPhone],
    );
    if (existing.length === 0) {
      return currentPhone;
    }
    suffix++;
    if (suffix > 100)
      throw new Error(
        `Could not find a unique phone number for ${originalPhone} after 100 attempts`,
      );
  }
}

async function fix() {
  await AppDataSource.initialize();

  console.log('Fixing duplicates in Businesses...');
  const businessDuplicates = await AppDataSource.query(`
    SELECT phone, COUNT(*) as count 
    FROM businesses 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  `);

  for (const dup of businessDuplicates) {
    const records = await AppDataSource.query(
      `SELECT id, name FROM businesses WHERE phone = $1 ORDER BY "createdAt" ASC`,
      [dup.phone],
    );
    // Skip the first one
    for (let i = 1; i < records.length; i++) {
      const newPhone = await findUniquePhone('businesses', dup.phone);
      console.log(
        `Updating Business ${records[i].name} (${records[i].id}): ${dup.phone} -> ${newPhone}`,
      );
      await AppDataSource.query(
        `UPDATE businesses SET phone = $1 WHERE id = $2`,
        [newPhone, records[i].id],
      );
    }
  }

  console.log('\nFixing duplicates in Users...');
  const userDuplicates = await AppDataSource.query(`
    SELECT phone, COUNT(*) as count 
    FROM users 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  `);

  for (const dup of userDuplicates) {
    const records = await AppDataSource.query(
      `SELECT id, email FROM users WHERE phone = $1 ORDER BY "createdAt" ASC`,
      [dup.phone],
    );
    // Skip the first one
    for (let i = 1; i < records.length; i++) {
      const newPhone = await findUniquePhone('users', dup.phone);
      console.log(
        `Updating User ${records[i].email} (${records[i].id}): ${dup.phone} -> ${newPhone}`,
      );
      await AppDataSource.query(`UPDATE users SET phone = $1 WHERE id = $2`, [
        newPhone,
        records[i].id,
      ]);
    }
  }

  console.log('\nDone!');
  await AppDataSource.destroy();
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
