import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Business, User, Branch, Visit, Reward]),
    MailModule,
    DevicesModule,
    forwardRef(() => BranchesModule),
    forwardRef(() => SubscriptionsModule),
  ],
  providers: [BusinessesService],
  controllers: [BusinessesController, PublicBusinessesController],
  exports: [BusinessesService],
})
export class BusinessesModule {}
