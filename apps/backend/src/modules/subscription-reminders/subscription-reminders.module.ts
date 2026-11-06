import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { Cluster } from '../clusters/entities/cluster.entity';
import { User } from '../users/entities/user.entity';
import { RotatorImpression } from '../rotator/entities/rotator-impression.entity';
import { SubscriptionReminderTemplate } from './entities/subscription-reminder-template.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';
import { SubscriptionRemindersService } from './subscription-reminders.service';
import { SubscriptionRemindersController } from './subscription-reminders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Branch,
      Business,
      Cluster,
      User,
      RotatorImpression,
      SubscriptionReminderTemplate,
    ]),
    NotificationsModule,
    MailModule,
  ],
  controllers: [SubscriptionRemindersController],
  providers: [SubscriptionRemindersService],
  exports: [SubscriptionRemindersService],
})
export class SubscriptionRemindersModule {}
