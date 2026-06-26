import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessDashboardController } from './business-dashboard.controller';
import { BusinessDashboardService } from './business-dashboard.service';
import { Visit } from '../visitors/entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visit,
      Device,
      User,
      Notification,
      Campaign,
      Reward,
      Branch,
      Business,
    ]),
  ],
  controllers: [BusinessDashboardController],
  providers: [BusinessDashboardService],
  exports: [BusinessDashboardService],
})
export class BusinessDashboardModule {}
