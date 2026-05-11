import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  
  const subs = await ds.query(`
    SELECT s.id as sub_id, s.status, u.email, u.id as user_id, b.id as business_id
    FROM subscriptions s 
    JOIN businesses b ON s."businessId" = b.id 
    JOIN users u ON b."ownerId" = u.id 
    WHERE s.status IN ('active', 'trial')
  `);
  
  console.log('Active Subscriptions:', JSON.stringify(subs, null, 2));

  await app.close();
}
run();
