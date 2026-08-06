import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosSale } from './entities/pos-sale.entity';
import { PosSaleItem } from './entities/pos-sale-item.entity';
import { PosSplitPayment } from './entities/pos-split-payment.entity';
import { PosHeldSale } from './entities/pos-held-sale.entity';
import { PosHeldSaleItem } from './entities/pos-held-sale-item.entity';
import { PosRegisterSession } from './entities/pos-register-session.entity';
import { PosRefund } from './entities/pos-refund.entity';
import { PosRefundItem } from './entities/pos-refund-item.entity';
import { PosCashDrop } from './entities/pos-cash-drop.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOrder } from '../catalogue-orders/entities/catalogue-order.entity';
import { CatalogueOrderItem } from '../catalogue-orders/entities/catalogue-order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { FinancialTransaction } from '../fos-core/entities/financial-transaction.entity';
import { CatalogueOrderModule } from '../catalogue-orders/catalogue-orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { InventoryCountingModule } from '../inventory-counting/inventory-counting.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PosSale,
      PosSaleItem,
      PosSplitPayment,
      PosHeldSale,
      PosHeldSaleItem,
      PosRegisterSession,
      PosRefund,
      PosRefundItem,
      PosCashDrop,
      CatalogueItem,
      CatalogueOffer,
      CatalogueOrder,
      CatalogueOrderItem,
      Business,
      Branch,
      User,
      FinancialTransaction,
    ]),
    CatalogueOrderModule,
    NotificationsModule,
    forwardRef(() => LoyaltyModule),
    InventoryCountingModule,
  ],
  controllers: [PosController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
