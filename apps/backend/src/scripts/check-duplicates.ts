import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Business } from '../modules/businesses/entities/business.entity';
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

async function check() {
  await AppDataSource.initialize();
  
  console.log('Checking for duplicate phone numbers in Businesses...');
  const businessDuplicates = await AppDataSource.query(`
    SELECT phone, COUNT(*) as count 
    FROM businesses 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  `);
  console.log('Business Duplicates:', businessDuplicates);

  if (businessDuplicates.length > 0) {
    for (const dup of businessDuplicates) {
       const details = await AppDataSource.query(`SELECT id, name, phone FROM businesses WHERE phone = $1`, [dup.phone]);
       console.log(`Details for ${dup.phone}:`, details);
    }
  }

  console.log('\nChecking for duplicate phone numbers in Users...');
  const userDuplicates = await AppDataSource.query(`
    SELECT phone, COUNT(*) as count 
    FROM users 
    WHERE phone IS NOT NULL 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  `);
  console.log('User Duplicates:', userDuplicates);

  if (userDuplicates.length > 0) {
    for (const dup of userDuplicates) {
       const details = await AppDataSource.query(`SELECT id, "firstName", "lastName", email, phone FROM users WHERE phone = $1`, [dup.phone]);
       console.log(`Details for ${dup.phone}:`, details);
    }
  }

  await AppDataSource.destroy();
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
