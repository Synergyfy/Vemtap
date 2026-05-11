import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import { QrThriveService } from '../src/modules/qr-thrive/qr-thrive.service';
import { Repository, DataSource } from 'typeorm';
import { QrThriveUserMapping } from '../src/modules/qr-thrive/entities/qr-thrive-user-mapping.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const subscriptionsService = app.get(SubscriptionsService);
  const mappingRepo = app.get<Repository<QrThriveUserMapping>>(getRepositoryToken(QrThriveUserMapping));
  const dataSource = app.get(DataSource);

  const businessId = 'dfb7f9c2-54b8-44ff-9725-fde544073c9a';
  console.log(`Triggering sync for candidate business: ${businessId}`);

  await subscriptionsService.syncUserSubscriptionToQrThrive(businessId);
  console.log('Sync triggered successfully.');

  const mapping = await mappingRepo.findOne({ 
    where: { userId: '13953e6c-6e76-4981-b4a4-3ade775f233b' }
  });
  console.log('Resulting mapping:', mapping);

  await app.close();
}

bootstrap().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
