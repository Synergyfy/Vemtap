import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  
  // Search in both businesses and users
  const businesses = await ds.query(`
    SELECT id, name, "ownerId" 
    FROM businesses 
    WHERE name ILIKE '%Tribe%' OR name ILIKE '%Boutique%' OR phone LIKE '%08142446114%'
  `);
  
  console.log('Businesses found:', businesses);
  
  if (businesses.length > 0) {
    const ownerId = businesses[0].ownerId;
    const user = await ds.query(`SELECT id, email, role FROM users WHERE id = $1`, [ownerId]);
    console.log('Owner details:', user);
  }

  await app.close();
}
run();
