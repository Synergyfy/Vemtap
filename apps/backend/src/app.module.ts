import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DevicesModule } from './modules/devices/devices.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { ProductsModule } from './modules/products/products.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UserStatusGuard } from './common/guards/user-status.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { FosEnvelopeInterceptor } from './common/interceptors/fos-envelope.interceptor';
import { SubscriptionGuard } from './modules/subscriptions/guards/subscription.guard';
import { CapabilityGuard } from './modules/subscriptions/guards/capability.guard';
import { SettingsModule } from './modules/settings/settings.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PartnershipsModule } from './modules/partnerships/partnerships.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { SupportModule } from './modules/support/support.module';
import { SystemModule } from './modules/system/system.module';
import { StatusModule } from './modules/status/status.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { FormsModule } from './modules/forms/forms.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ObservabilityModule } from './observability/observability.module';
import { AdministrationModule } from './modules/administration/administration.module';
import { ImpersonationGuard } from './modules/administration/impersonation.guard';
import { CustomerImpersonationGuard } from './modules/administration/customer-impersonation.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { CatalogueOrderModule } from './modules/catalogue-orders/catalogue-orders.module';
import { BusinessProfilingModule } from './modules/business-profiling/business-profiling.module';
import { AffiliatesModule } from './modules/affiliates/affiliates.module';
import { TrainingModule } from './modules/training/training.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { QrThriveModule } from './modules/qr-thrive/qr-thrive.module';
import { BannersModule } from './modules/banners/banners.module';
import { BusinessDashboardModule } from './modules/business-dashboard/business-dashboard.module';
import { MarketingAssetsModule } from './modules/marketing-assets/marketing-assets.module';
import { FosCoreModule } from './modules/fos-core/fos-core.module';
import { FosDashboardModule } from './modules/fos-dashboard/fos-dashboard.module';
import { FosPnlModule } from './modules/fos-pnl/fos-pnl.module';
import { FosFinancialPlanningModule } from './modules/fos-financial-planning/fos-financial-planning.module';
import { FosForecastingModule } from './modules/fos-forecasting/fos-forecasting.module';
import { FosRevenueAnalyticsModule } from './modules/fos-revenue-analytics/fos-revenue-analytics.module';
import { FosBudgetsModule } from './modules/fos-budgets/fos-budgets.module';
import { FosGoalsModule } from './modules/fos-goals/fos-goals.module';
import { FosLedgerModule } from './modules/fos-ledger/fos-ledger.module';
import { FosMessagingModule } from './modules/fos-messaging/fos-messaging.module';
import { FosFunnelModule } from './modules/fos-funnel/fos-funnel.module';
import { FosSettingsModule } from './modules/fos-settings/fos-settings.module';
import { FosReportsModule } from './modules/fos-reports/fos-reports.module';
import { FosAiAssistantModule } from './modules/fos-ai-assistant/fos-ai-assistant.module';
import { FosRecordsModule } from './modules/fos-records/fos-records.module';
import { FosTransfersModule } from './modules/fos-transfers/fos-transfers.module';
import { FosPlanningModule } from './modules/fos-planning/fos-planning.module';
import { FosProfileModule } from './modules/fos-profile/fos-profile.module';

import { dataSourceOptions } from './database/data-source';
import { CatalogueCartModule } from './modules/catalogue-cart/catalogue-cart.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryCountingModule } from './modules/inventory-counting/inventory-counting.module';
import { LegalComplianceModule } from './modules/legal-compliance/legal-compliance.module';
import { AiCopilotModule } from './modules/ai-copilot/ai-copilot.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { ClustersModule } from './modules/clusters/clusters.module';
import { RotatorModule } from './modules/rotator/rotator.module';
import { SubscriptionRemindersModule } from './modules/subscription-reminders/subscription-reminders.module';
import { DealEngagementModule } from './modules/deal-engagement/deal-engagement.module';
import { PublicDiscoveryModule } from './modules/public-discovery/public-discovery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
        join(process.cwd(), '.env'),
        join(
          __dirname,
          '..',
          '..',
          `.env.${process.env.NODE_ENV || 'development'}`,
        ),
        join(__dirname, '..', '..', '.env'),
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        if (process.env.NODE_ENV === 'test') {
          return { ttl: 60 * 60 * 1000 };
        }
        const ttl = 60 * 60 * 1000; // 1 hour default TTL
        const url =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        try {
          return {
            store: await redisStore({
              url,
              ttl,
            }),
          };
        } catch (err) {
          // Redis is unreachable (e.g. local dev without Redis running). Fall
          // back to the default in-memory store so the app can still boot and
          // serve traffic; caches are non-authoritative, so a missing Redis
          // must never take the whole API down.
          Logger.warn(
            `Redis cache unavailable (${(err as Error).message}); using in-memory cache store`,
            'CacheModule',
          );
          return { ttl };
        }
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = (configService.get<string>('DB_TYPE') ||
          'postgres') as any;
        const dbName = configService.get<string>('DB_NAME');

        return {
          type: dbType,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: dbName,
          ssl:
            configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
          autoLoadEntities: true,
          synchronize:
            process.env.NODE_ENV === 'test' ||
            (dbName?.includes('test') && process.env.DEPLOYMENT !== 'true'),
          dropSchema:
            process.env.NODE_ENV === 'test' &&
            dbName?.includes('test') &&
            process.env.DEPLOYMENT !== 'true',
        };
      },
    }),
    AuthModule,
    UsersModule,
    BusinessesModule,
    NotificationsModule,
    DevicesModule,
    VisitorsModule,
    CampaignsModule,
    SurveysModule,
    ProductsModule,
    AnalyticsModule,
    SubscriptionsModule,
    CouponsModule,
    SettingsModule,
    BranchesModule,
    PartnershipsModule,
    LoyaltyModule,
    SupportModule,
    SystemModule,
    MessagingModule,
    FormsModule,
    CategoriesModule,
    ObservabilityModule,
    AdministrationModule,
    CatalogueModule,
    CatalogueOrderModule,
    CatalogueCartModule,
    BusinessProfilingModule,
    AffiliatesModule,
    TrainingModule,
    DiscoveryModule,
    QrThriveModule,
    BannersModule,
    BusinessDashboardModule,
    MarketingAssetsModule,
    FosCoreModule,
    FosDashboardModule,
    FosPnlModule,
    FosFinancialPlanningModule,
    FosForecastingModule,
    FosRevenueAnalyticsModule,
    FosBudgetsModule,
    FosGoalsModule,
    FosLedgerModule,
    FosMessagingModule,
    FosFunnelModule,
    FosSettingsModule,
    FosReportsModule,
    FosAiAssistantModule,
    FosRecordsModule,
    FosTransfersModule,
    FosPlanningModule,
    FosProfileModule,
    PosModule,
    InventoryCountingModule,
    LegalComplianceModule,
    AiCopilotModule,
    FeedbackModule,
    KnowledgeBaseModule,
    ClustersModule,
    RotatorModule,
    SubscriptionRemindersModule,
    DealEngagementModule,
    PublicDiscoveryModule,
    StatusModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ImpersonationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CustomerImpersonationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UserStatusGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CapabilityGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FosEnvelopeInterceptor,
    },
  ],
})
export class AppModule {}
