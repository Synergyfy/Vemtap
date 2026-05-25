import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushNotificationService } from './push-notification.service';
import { PushNotificationProcessor, PUSH_NOTIFICATION_QUEUE } from './push-notification.processor';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Contact]),
    // BullMQ root connection (Redis) — re-uses the same env vars as MessagingModule.
    // forRoot is idempotent; if MessagingModule already registered it in the same
    // DI scope, NestJS will reuse the existing connection.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD');
        const useTls =
          configService.get<string>('REDIS_TLS') === 'true' ||
          host.includes('upstash.io');

        return {
          connection: {
            host,
            port,
            password,
            ...(useTls ? { tls: {} } : {}),
          },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 500,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5_000 },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: PUSH_NOTIFICATION_QUEUE,
    }),
  ],
  providers: [NotificationsService, PushNotificationService, PushNotificationProcessor],
  controllers: [NotificationsController],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
