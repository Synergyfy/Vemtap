import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosRevenueAnalyticsController } from './fos-revenue-analytics.controller';
import { FosRevenueAnalyticsService } from './fos-revenue-analytics.service';
import { MetricsSnapshot } from '../fos-dashboard/entities/metrics-snapshot.entity';
import { FosCoreModule } from '../fos-core/fos-core.module';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MetricsSnapshot, Business, User, Subscription, Plan]),
    FosCoreModule,
  ],
  controllers: [FosRevenueAnalyticsController],
  providers: [FosRevenueAnalyticsService],
  exports: [FosRevenueAnalyticsService],
})
export class FosRevenueAnalyticsModule {}
