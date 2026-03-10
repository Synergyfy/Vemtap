import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Business } from '../businesses/entities/business.entity';
import { Device } from '../devices/entities/device.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { Message } from '../messaging/entities/message.entity';
import { LoyaltyProfile } from '../campaigns/entities/loyalty-profile.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Visit,
      Business,
      Device,
      MessageLog,
      Message,
      LoyaltyProfile,
      PointTransaction,
      Redemption,
      Branch,
    ]),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
