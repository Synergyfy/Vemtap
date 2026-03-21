import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Business } from '../businesses/entities/business.entity';
import { Device } from '../devices/entities/device.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { Message } from '../messaging/entities/message.entity';
import { PointTransaction } from '../loyalty/entities/point-transaction.entity';
import { RedemptionCode } from '../loyalty/entities/redemption-code.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { Branch } from '../branches/entities/branch.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Visit,
      Business,
      Device,
      Subscription,
      MessageLog,
      Message,
      PointTransaction,
      RedemptionCode,
      Reward,
      Branch,
    ]),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
