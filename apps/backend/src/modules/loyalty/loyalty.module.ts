import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyProfile } from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { DevicesModule } from '../devices/devices.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { Visit } from '../visitors/entities/visit.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyProfile,
      Reward,
      PointTransaction,
      Redemption,
      Visit,
    ]),
    DevicesModule,
    CampaignsModule,
    BranchesModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
