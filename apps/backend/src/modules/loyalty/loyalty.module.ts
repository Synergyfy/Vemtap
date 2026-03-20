import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { RewardTemplate } from './entities/reward-template.entity';
import { Reward } from './entities/reward.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { PointCode } from './entities/point-code.entity';
import { RedemptionCode } from './entities/redemption-code.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { DevicesModule } from '../devices/devices.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';

import { Visit } from '../visitors/entities/visit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RewardTemplate,
      Reward,
      PointTransaction,
      PointCode,
      RedemptionCode,
      User,
      Branch,
      Visit,
    ]),
    forwardRef(() => DevicesModule),
    forwardRef(() => CampaignsModule),
    forwardRef(() => UsersModule),
    forwardRef(() => BranchesModule),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
