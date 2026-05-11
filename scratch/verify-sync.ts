import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import { QrThriveService } from '../src/modules/qr-thrive/qr-thrive.service';
import { Repository } from 'typeorm';
import { QrThriveUserMapping } from '../src/modules/qr-thrive/entities/qr-thrive-user-mapping.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const subscriptionsService = app.get(SubscriptionsService);
  const qrThriveService = app.get(QrThriveService);
  const mappingRepo = app.get<Repository<QrThriveUserMapping>>(getRepositoryToken(QrThriveUserMapping));

  const qrThriveUserId = 'ab291ef1-31ed-4c2e-a56e-50d754dcc006';
  console.log(`Searching for mapping for QR-Thrive User ID: ${qrThriveUserId}`);

  const mapping = await mappingRepo.findOne({ 
    where: { qrThriveUserId },
    relations: ['user'] 
  });

  if (!mapping) {
    console.error('Mapping not found in database.');
    // Try to find the user by some other means or list all mappings
    const allMappings = await mappingRepo.find({ take: 10 });
    console.log('Available mappings:', allMappings.map(m => ({ vem: m.userId, qr: m.qrThriveUserId })));
    process.exit(1);
  }

  console.log(`Found mapping! Vemtap User: ${mapping.userId}`);
  
  // Find business for this user
  const user = mapping.user;
  // We need a business ID to call syncUserSubscriptionToQrThrive
  // Let's find businesses owned by this user
  const { DataSource } = require('typeorm');
  const dataSource = app.get(DataSource);
  const businesses = await dataSource.query(`SELECT id FROM businesses WHERE "ownerId" = $1`, [user.id]);

  if (businesses.length === 0) {
    console.error('No business found for this user.');
    process.exit(1);
  }

  const businessId = businesses[0].id;
  console.log(`Triggering sync for business: ${businessId}`);

  await subscriptionsService.syncUserSubscriptionToQrThrive(businessId);
  console.log('Sync triggered successfully.');

  await app.close();
}

bootstrap().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
