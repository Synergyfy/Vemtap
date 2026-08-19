import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { PromotionCode } from './entities/promotion-code.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { CouponsController } from './controllers/coupons.controller';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { CouponsService } from './services/coupons.service';
import { PromotionCodesService } from './services/promotion-codes.service';
import { CouponEngineService } from './services/coupon-engine.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Coupon,
      PromotionCode,
      CouponRedemption,
      Plan,
      Subscription,
      Business,
      User,
    ]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => BranchesModule),
  ],
  controllers: [CouponsController, AdminCouponsController],
  providers: [
    CouponsService,
    PromotionCodesService,
    CouponEngineService,
  ],
  exports: [
    TypeOrmModule,
    CouponsService,
    PromotionCodesService,
    CouponEngineService,
  ],
})
export class CouponsModule {}
