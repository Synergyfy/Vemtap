import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { Partnership } from '../partnerships/entities/partnership.entity';
import { Business } from '../businesses/entities/business.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      Visit,
      Partnership,
      CatalogueOffer,
      Business,
      Subscription,
      Plan,
      Notification,
    ]),
    BranchesModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
