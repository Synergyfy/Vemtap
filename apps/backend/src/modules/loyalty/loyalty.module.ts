import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { Reward } from './entities/reward.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { Redemption } from './entities/redemption.entity';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyProfile,
      Reward,
      LoyaltyTransaction,
      Redemption,
    ]),
    DevicesModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
