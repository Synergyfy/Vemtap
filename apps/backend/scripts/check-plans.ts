import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  
  const plans = await ds.query(`SELECT id, name, "qrThrivePlanId" FROM plans`);
  console.log('Plans:', JSON.stringify(plans, null, 2));

  await app.close();
}
run();
