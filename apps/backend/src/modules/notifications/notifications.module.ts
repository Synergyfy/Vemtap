import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from './push-notification.service';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Contact])],
  providers: [NotificationsService, PushNotificationService],
  controllers: [NotificationsController],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
