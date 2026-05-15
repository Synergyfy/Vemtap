import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { QrThriveService } from './qr-thrive.service';
import { QrThriveEncryptionService } from './qr-thrive-encryption.service';
import { SubscriptionTokenService } from './subscription-token.service';
import { QrThriveController } from './qr-thrive.controller';
import { QrThriveCallbackController } from './qr-thrive-callback.controller';
import { QrThriveUserMapping } from './entities/qr-thrive-user-mapping.entity';

import { ExternalLeadStatusEntity } from './entities/external-lead-status.entity';
import { Branch } from '../branches/entities/branch.entity';
import { BranchesModule } from '../branches/branches.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QrThriveUserMapping,

      ExternalLeadStatusEntity,
      Branch,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    JwtModule.register({}),
    ConfigModule,
    forwardRef(() => BranchesModule),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [QrThriveService, QrThriveEncryptionService, SubscriptionTokenService],
  controllers: [QrThriveController, QrThriveCallbackController],
  exports: [QrThriveService, SubscriptionTokenService],
})
export class QrThriveModule {}
