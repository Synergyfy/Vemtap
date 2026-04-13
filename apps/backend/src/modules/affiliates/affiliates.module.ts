import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AffiliateProfile } from './entities/affiliate-profile.entity';
import { AffiliateReferral } from './entities/referral.entity';
import { AffiliateCommission } from './entities/commission.entity';
import { AffiliateWithdrawalRequest } from './entities/withdrawal-request.entity';
import { AffiliateTrainingModule } from './entities/training-module.entity';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { User } from '../users/entities/user.entity';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateProfile,
      AffiliateReferral,
      AffiliateCommission,
      AffiliateWithdrawalRequest,
      AffiliateTrainingModule,
      User,
    ]),
    SettingsModule,
    NotificationsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [AffiliatesController],
  providers: [AffiliatesService],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
