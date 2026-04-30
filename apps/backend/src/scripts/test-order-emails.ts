import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MailService } from '../modules/mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mailService = app.get(MailService);

  const mockOrder = {
    id: '12345678-90ab-cdef-1234-567890abcdef',
    createdAt: new Date(),
    totalAmount: 15500,
    tableNumber: 'Table 12',
    customer: {
      firstName: 'Azeem',
      lastName: 'User',
    },
    items: [
      {
        quantity: 2,
        priceAtOrder: 5000,
        item: {
          name: 'Premium Burger',
          shortDescription: 'With double cheese and truffle mayo',
        },
      },
      {
        quantity: 1,
        priceAtOrder: 5500,
        item: {
          name: 'Craft Beer',
          shortDescription: 'Local brewery special',
        },
      },
    ],
  };

  const business = {
    name: 'Synergyfy Eliztap',
    address: '123 Innovation Drive, Tech City',
    phone: '+234 800 123 4567',
    website: 'https://synergyfy.com',
  };

  const statuses: (
    | 'placed'
    | 'processing'
    | 'completed'
    | 'cancelled'
    | 'rejected'
  )[] = ['placed', 'processing', 'completed', 'cancelled', 'rejected'];

  console.log('Generating test emails...');

  const resultsDir = path.join(process.cwd(), 'tmp', 'email-previews');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  for (const status of statuses) {
    const { html } = mailService.generateOrderNotificationHtml(
      mockOrder,
      status,
      business,
    );

    const filePath = path.join(resultsDir, `${status}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Captured ${status} email to ${filePath}`);
  }

  console.log('All test emails generated in tmp/email-previews/');
  await app.close();
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
