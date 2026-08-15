import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Business } from './entities/business.entity';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PublicBusinessesController } from './public-businesses.controller';
import { User } from '../users/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { DevicesModule } from '../devices/devices.module';
import { BranchesModule } from '../branches/branches.module';
import { Reward } from '../loyalty/entities/reward.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BusinessVerifiedGuard } from '../../common/guards/business-verified.guard';
import { RotatorModule } from '../rotator/rotator.module';
import {
  GeocodingProcessor,
  GEOCODING_QUEUE,
} from './processors/geocoding.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      User,
      Branch,
      Visit,
      Reward,
      Subscription,
      Plan,
    ]),
    BullModule.registerQueue({
      name: GEOCODING_QUEUE,
    }),
    MailModule,
    DevicesModule,
    forwardRef(() => BranchesModule),
    forwardRef(() => SubscriptionsModule),
    RotatorModule,
  ],
  providers: [BusinessesService, GeocodingProcessor, BusinessVerifiedGuard],
  controllers: [BusinessesController, PublicBusinessesController],
  exports: [TypeOrmModule, BusinessesService, BusinessVerifiedGuard],
})
export class BusinessesModule {}
