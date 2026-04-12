import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { BusinessesModule } from '../businesses/businesses.module';
import { HttpModule } from '@nestjs/axios';
import { PlansController } from './plans.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';
import { PaymentsModule } from '../payments/payments.module';
import { TrialRestrictionGuard } from './guards/trial-restriction.guard';
import { CapabilityGuard } from './guards/capability.guard';
import { AnalyticsLevelGuard } from './guards/analytics-level.guard';
import { BranchesModule } from '../branches/branches.module';
import { MessagingModule } from '../messaging/messaging.module';
import { QrThriveModule } from '../qr-thrive/qr-thrive.module';

import { Branch } from '../branches/entities/branch.entity';
import { Device } from '../devices/entities/device.entity';
import { CatalogueCategory } from '../catalogue/entities/catalogue-category.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { AutomationRule } from '../messaging/entities/automation-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      Business,
      User,
      Branch,
      Device,
      CatalogueCategory,
      CatalogueItem,
      CatalogueOffer,
      AutomationRule,
    ]),
    forwardRef(() => BusinessesModule),
    PaymentsModule,
    forwardRef(() => BranchesModule),
    forwardRef(() => MessagingModule),
    forwardRef(() => QrThriveModule),
  ],
  controllers: [PlansController, SubscriptionsController],
  providers: [
    PlansService,
    SubscriptionsService,
    TrialRestrictionGuard,
    CapabilityGuard,
    AnalyticsLevelGuard,
  ],
  exports: [
    TypeOrmModule,
    PlansService,
    SubscriptionsService,
    TrialRestrictionGuard,
    CapabilityGuard,
    AnalyticsLevelGuard,
  ],
})
export class SubscriptionsModule {}
