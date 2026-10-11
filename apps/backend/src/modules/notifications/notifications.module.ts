import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Notification } from './entities/notification.entity';
import { NotificationBroadcast } from './entities/notification-broadcast.entity';
import { PushToken } from './entities/push-token.entity';
import { NotificationsService } from './notifications.service';
import { DealVelocityService } from './deal-velocity.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PushNotificationService } from './push-notification.service';
import {
  PushNotificationProcessor,
  PUSH_NOTIFICATION_QUEUE,
} from './push-notification.processor';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationBroadcast,
      PushToken,
      User,
      Contact,
      // Read-only: the velocity detector counts claims written by the
      // catalogue module. Injected here rather than imported so the
      // notifications module does not depend on the catalogue module.
      CatalogueOfferClaim,
    ]),
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
    // The gateway verifies handshake tokens, exactly as MessagingGateway does.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    NotificationsService,
    DealVelocityService,
    PushNotificationService,
    PushNotificationProcessor,
    NotificationsGateway,
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService, PushNotificationService],
})
export class NotificationsModule {}
