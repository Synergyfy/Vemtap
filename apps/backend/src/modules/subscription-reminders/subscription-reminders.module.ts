import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Cluster } from '../clusters/entities/cluster.entity';
import { User } from '../users/entities/user.entity';
import { RotatorImpression } from '../rotator/entities/rotator-impression.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { SubscriptionRemindersService } from './subscription-reminders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Branch,
      Business,
      Cluster,
      User,
      RotatorImpression,
    ]),
    NotificationsModule,
    MailModule,
  ],
  providers: [SubscriptionRemindersService],
  exports: [SubscriptionRemindersService],
})
export class SubscriptionRemindersModule {}
