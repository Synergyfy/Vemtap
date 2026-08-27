import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Cluster } from '../clusters/entities/cluster.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { RotatorConfig } from './entities/rotator-config.entity';
import { RotatorClusterConfig } from './entities/rotator-cluster-config.entity';
import { RotatorClusterOffer } from './entities/rotator-cluster-offer.entity';
import { RotatorDealSchedule } from './entities/rotator-deal-schedule.entity';
import { RotatorRotationRecord } from './entities/rotator-rotation-record.entity';
import { RotatorImpression } from './entities/rotator-impression.entity';
import { RotatorCacheService } from './rotator-cache.service';
import { RotatorInvalidationService } from './rotator-invalidation.service';
import { RotatorEligibilityService } from './rotator-eligibility.service';
import { RotatorEngineService } from './rotator-engine.service';
import { RotatorAnalyticsService } from './rotator-analytics.service';
import { RotatorRefreshProcessor } from './rotator-refresh.processor';
import { RotatorService } from './rotator.service';
import {
  ClusterRotatorController,
  GlobalRotatorController,
  RotatorPublicController,
} from './rotator.controller';
import { ROTATOR_REFRESH_QUEUE } from './rotator.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cluster,
      Branch,
      Business,
      CatalogueOffer,
      CatalogueOfferClaim,
      RotatorConfig,
      RotatorClusterConfig,
      RotatorClusterOffer,
      RotatorDealSchedule,
      RotatorRotationRecord,
      RotatorImpression,
      Subscription,
    ]),
    BullModule.registerQueue({
      name: ROTATOR_REFRESH_QUEUE,
    }),
  ],
  controllers: [
    GlobalRotatorController,
    ClusterRotatorController,
    RotatorPublicController,
  ],
  providers: [
    RotatorCacheService,
    RotatorInvalidationService,
    RotatorEligibilityService,
    RotatorEngineService,
    RotatorAnalyticsService,
    RotatorRefreshProcessor,
    RotatorService,
  ],
  exports: [
    RotatorService,
    RotatorEligibilityService,
    RotatorEngineService,
    RotatorAnalyticsService,
    RotatorInvalidationService,
    RotatorCacheService,
  ],
})
export class RotatorModule {}
