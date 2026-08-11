import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AffiliateProfile } from './entities/affiliate-profile.entity';
import { AffiliateReferral } from './entities/referral.entity';
import { AffiliateCommission } from './entities/commission.entity';
import { AffiliateWithdrawalRequest } from './entities/withdrawal-request.entity';
import { AffiliateTrainingModule } from './entities/training-module.entity';
import { FosAgentCommission } from './entities/agent-commission.entity';
import { AffiliatesService } from './affiliates.service';
import { ExternalAffiliateModule } from './external-affiliate.module';
import { AffiliatesController } from './affiliates.controller';
import { VemtapAffiliateAgentsService } from './vemtap-affiliate-agents.service';
import { FosAgentCommissionService } from './fos-agent-commission.service';
import { User } from '../users/entities/user.entity';
import { SettingsModule } from '../settings/settings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AffiliateProfile,
      AffiliateReferral,
      AffiliateCommission,
      AffiliateWithdrawalRequest,
      AffiliateTrainingModule,
      FosAgentCommission,
      User,
    ]),
    HttpModule,
    SettingsModule,
    NotificationsModule,
    ExternalAffiliateModule,
    FosCoreModule,
    forwardRef(() => BusinessesModule),
  ],
  controllers: [AffiliatesController],
  providers: [
    AffiliatesService,
    VemtapAffiliateAgentsService,
    FosAgentCommissionService,
  ],
  exports: [AffiliatesService, ExternalAffiliateModule],
})
export class AffiliatesModule {}
