import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderItem } from '../catalogue-orders/entities/catalogue-order-item.entity';
import { CatalogueOrderModule } from '../catalogue-orders/catalogue-orders.module';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { StoreQrCode } from './entities/store-qr-code.entity';
import { StoreOrderingSetting } from './entities/store-ordering-setting.entity';
import { StoreOrderingService } from './store-ordering.service';
import {
  PublicStoreQrController,
  StoreOrderingController,
} from './store-ordering.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueOrder,
      CatalogueOrderItem,
      StoreQrCode,
      StoreOrderingSetting,
      Branch,
      User,
    ]),
    CatalogueOrderModule,
  ],
  controllers: [StoreOrderingController, PublicStoreQrController],
  providers: [StoreOrderingService],
})
export class StoreOrderingModule {}
