import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ExternalAffiliateService } from './external-affiliate.service';
import { AffiliateSyncService } from './affiliate-sync.service';
import { AffiliateSyncProcessor } from './affiliate-sync.processor';
import { AFFILIATE_EXTERNAL_SYNC_QUEUE } from './external-affiliate.constants';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    // BullMQ root connection (Redis) — re-uses the same env vars as the
    // Messaging/Notifications modules. forRoot is idempotent across modules.
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
            removeOnFail: 1000,
            attempts: 5,
            backoff: { type: 'exponential', delay: 5_000 },
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: AFFILIATE_EXTERNAL_SYNC_QUEUE,
    }),
  ],
  providers: [
    ExternalAffiliateService,
    AffiliateSyncService,
    AffiliateSyncProcessor,
  ],
  exports: [ExternalAffiliateService, AffiliateSyncService],
})
export class ExternalAffiliateModule {}
