import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { Business } from '../businesses/entities/business.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DevicesModule } from '../devices/devices.module';
import { QrThriveModule } from '../qr-thrive/qr-thrive.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, Business, CatalogueOffer]),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => DevicesModule),
    forwardRef(() => QrThriveModule),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
