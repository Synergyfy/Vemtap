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
        }
      },
      {
        quantity: 1,
        priceAtOrder: 5500,
        item: {
          name: 'Craft Beer',
          shortDescription: 'Local brewery special',
        }
      }
    ]
  };

  const business = {
    name: 'Synergyfy Eliztap',
    address: '123 Innovation Drive, Tech City',
    phone: '+234 800 123 4567',
    website: 'https://synergyfy.com'
  };

  const statuses: ('placed' | 'processing' | 'completed' | 'cancelled' | 'rejected')[] = [
    'placed', 'processing', 'completed', 'cancelled', 'rejected'
  ];

  console.log('Generating test emails...');

  // Mock the Resend client to capture HTML instead of sending
  const resultsDir = path.join(process.cwd(), 'tmp', 'email-previews');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // @ts-ignore - access private resend client for testing
  const originalSend = mailService.resend.emails.send.bind(mailService.resend.emails);
  // @ts-ignore
  mailService.resend = {
    emails: {
      send: async (options: { from: string; to: string; subject: string; html: string }) => {
        const status = options.subject.toLowerCase().includes('confirmation') ? 'placed' : 
                       options.subject.toLowerCase().includes('prepared') ? 'processing' :
                       options.subject.toLowerCase().includes('delivered') ? 'completed' :
                       options.subject.toLowerCase().includes('cancelled') ? 'cancelled' : 'rejected';
        
        const filePath = path.join(resultsDir, `${status}.html`);
        fs.writeFileSync(filePath, options.html);
        console.log(`Captured ${status} email to ${filePath}`);
        return { data: { id: 'mock-id' }, error: null };
      },
    },
  };

  for (const status of statuses) {
    await mailService.sendOrderNotification('test@example.com', mockOrder, status, business);
  }

  console.log('All test emails generated in tmp/email-previews/');
  await app.close();
}

bootstrap();
