import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosSettingsService } from './pos-settings.service';
import { PosTillsService } from './pos-tills.service';
import { PosStaffPinsService } from './pos-staff-pins.service';
import { PosPeripheralsService } from './pos-peripherals.service';
import { PosTillsController } from './pos-tills.controller';
import { PosStaffPinsController } from './pos-staff-pins.controller';
import { PosPeripheralsController } from './pos-peripherals.controller';
import { PosKitchenController } from './pos-kitchen.controller';
import { PosDisplayController } from './pos-display.controller';
import { PosPublicController } from './pos-public.controller';
import { PosKitchenService } from './pos-kitchen.service';
import { PosDisplayService } from './pos-display.service';
import { PosPublicService } from './pos-public.service';
import { PosGateway } from './pos.gateway';
import { PosTill } from './entities/pos-till.entity';
import { PosStaffPin } from './entities/pos-staff-pin.entity';
import { PosOverrideLog } from './entities/pos-override-log.entity';
import { PosPeripheral } from './entities/pos-peripheral.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
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
      PosTill,
      PosStaffPin,
      PosOverrideLog,
      PosPeripheral,
      Subscription,
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
    // Signs the short-lived supervisor override tokens.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    PosController,
    PosTillsController,
    PosStaffPinsController,
    PosPeripheralsController,
    PosKitchenController,
    PosDisplayController,
    PosPublicController,
  ],
  providers: [
    PosService,
    PosSettingsService,
    PosTillsService,
    PosStaffPinsService,
    PosPeripheralsService,
    PosKitchenService,
    PosDisplayService,
    PosPublicService,
    PosGateway,
  ],
  exports: [PosService, PosSettingsService],
})
export class PosModule {}
