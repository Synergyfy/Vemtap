import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueOrderService } from './catalogue-orders.service';
import { CatalogueOrdersController } from './catalogue-orders.controller';
import { CatalogueOrder } from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Visit } from '../visitors/entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueOrder,
      CatalogueOrderItem,
      CatalogueItem,
      CatalogueOffer,
      User,
      Branch,
      Visit,
      Device,
    ]),
    LoyaltyModule,
    NotificationsModule,
  ],
  controllers: [CatalogueOrdersController],
  providers: [CatalogueOrderService],
  exports: [CatalogueOrderService],
})
export class CatalogueOrderModule {}
