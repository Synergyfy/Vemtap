import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { BusinessesModule } from '../businesses/businesses.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';
import { ExternalAffiliateModule } from '../affiliates/external-affiliate.module';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => BusinessesModule),
    forwardRef(() => AffiliatesModule),
    ExternalAffiliateModule,
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
