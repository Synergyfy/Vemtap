import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueOrderService } from './catalogue-orders.service';
import { CatalogueOrdersController } from './catalogue-orders.controller';
import { CatalogueOrder } from './entities/catalogue-order.entity';
import { CatalogueOrderItem } from './entities/catalogue-order-item.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueOrder,
      CatalogueOrderItem,
      CatalogueItem,
      User,
      Branch,
    ]),
  ],
  controllers: [CatalogueOrdersController],
  providers: [CatalogueOrderService],
  exports: [CatalogueOrderService],
})
export class CatalogueOrderModule {}
