import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
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
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UserStatusGuard } from './common/guards/user-status.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SubscriptionGuard } from './modules/subscriptions/guards/subscription.guard';
import { SettingsModule } from './modules/settings/settings.module';
import { BranchesModule } from './modules/branches/branches.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { SupportModule } from './modules/support/support.module';
import { SystemModule } from './modules/system/system.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { FormsModule } from './modules/forms/forms.module';
import { CategoriesModule } from './modules/categories/categories.module';

import { dataSourceOptions } from './database/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'test'
          ? join(process.cwd(), '.env.test')
          : join(process.cwd(), '.env'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = (configService.get<string>('DB_TYPE') || 'postgres') as any;
        const dbName = configService.get<string>('DB_NAME');
        
        return {
          type: dbType,
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: dbName,
          ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
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
    SettingsModule,
    BranchesModule,
    LoyaltyModule,
    SupportModule,
    SystemModule,
    MessagingModule,
    FormsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
  ],
})
export class AppModule {}
