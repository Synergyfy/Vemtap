import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);
  
  const mapping = [
    { name: 'Starter (Free)', qrThriveId: '8bae20fd-b47a-479e-b461-7628db088fc9' },
    { name: 'Professional', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Ultimate', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Free Plan', qrThriveId: '8bae20fd-b47a-479e-b461-7628db088fc9' },
    { name: 'Basic Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Standard Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Premium Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Enterprise Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Free plan', qrThriveId: '8bae20fd-b47a-479e-b461-7628db088fc9' },
    { name: 'Silver Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Gold Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
    { name: 'Platinum Plan', qrThriveId: '81a2ecf5-6f62-4ad9-947c-202b90dc027b' },
  ];

  console.log('Updating plan mappings in Vemtap...');
  
  for (const item of mapping) {
    const result = await ds.query(
      `UPDATE plans SET "qrThrivePlanId" = $1 WHERE name = $2`,
      [item.qrThriveId, item.name]
    );
    console.log(`Updated ${item.name}: ${JSON.stringify(result)}`);
  }

  await app.close();
}
run();
