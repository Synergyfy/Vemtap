import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { AddOn } from './entities/addon.entity';
import { BusinessAddOn } from './entities/business-addon.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { BusinessesModule } from '../businesses/businesses.module';
import { HttpModule } from '@nestjs/axios';
import { PlansController } from './plans.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { AddonsController } from './addons.controller';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';
import { AddonsService } from './services/addons.service';
import { PaymentsModule } from '../payments/payments.module';
import { TrialRestrictionGuard } from './guards/trial-restriction.guard';
import { CapabilityGuard } from './guards/capability.guard';
import { AnalyticsLevelGuard } from './guards/analytics-level.guard';
import { BranchesModule } from '../branches/branches.module';
import { MessagingModule } from '../messaging/messaging.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { ExternalAffiliateModule } from '../affiliates/external-affiliate.module';
import { QrThriveModule } from '../qr-thrive/qr-thrive.module';
import { SettingsModule } from '../settings/settings.module';
import { BundleDiscount } from './entities/bundle-discount.entity';
import { BundleDiscountsService } from './services/bundle-discounts.service';
import { BundleDiscountsController } from './controllers/bundle-discounts.controller';
import { SubscriptionTaxConfig } from './entities/subscription-tax-config.entity';
import { SubscriptionTaxService } from './services/subscription-tax.service';

import { Branch } from '../branches/entities/branch.entity';
import { Device } from '../devices/entities/device.entity';
import { CatalogueCategory } from '../catalogue/entities/catalogue-category.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { AutomationRule } from '../messaging/entities/automation-rule.entity';
import { Reward } from '../loyalty/entities/reward.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      AddOn,
      BusinessAddOn,
      Business,
      User,
      Branch,
      Device,
      CatalogueCategory,
      CatalogueItem,
      CatalogueOffer,
      AutomationRule,
      BundleDiscount,
      Reward,
      SubscriptionTaxConfig,
    ]),
    forwardRef(() => BusinessesModule),
    PaymentsModule,
    forwardRef(() => BranchesModule),
    forwardRef(() => MessagingModule),
    forwardRef(() => AffiliatesModule),
    ExternalAffiliateModule,
    forwardRef(() => QrThriveModule),
    SettingsModule,
  ],
  controllers: [
    PlansController,
    SubscriptionsController,
    AddonsController,
    BundleDiscountsController,
  ],
  providers: [
    PlansService,
    SubscriptionsService,
    AddonsService,
    BundleDiscountsService,
    SubscriptionTaxService,
    TrialRestrictionGuard,
    CapabilityGuard,
    AnalyticsLevelGuard,
  ],
  exports: [
    TypeOrmModule,
    PlansService,
    SubscriptionsService,
    AddonsService,
    SubscriptionTaxService,
    TrialRestrictionGuard,
    CapabilityGuard,
    AnalyticsLevelGuard,
    BundleDiscountsService,
  ],
})
export class SubscriptionsModule {}
