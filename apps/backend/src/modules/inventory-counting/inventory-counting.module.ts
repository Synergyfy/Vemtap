import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryCountingController } from './inventory-counting.controller';
import { InventoryCountingService } from './inventory-counting.service';
import { StockCountSession } from './entities/stock-count-session.entity';
import { StockCountItem } from './entities/stock-count-item.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockCountSession,
      StockCountItem,
      CatalogueItem,
      Branch,
    ]),
  ],
  controllers: [InventoryCountingController],
  providers: [InventoryCountingService],
  exports: [InventoryCountingService],
})
export class InventoryCountingModule {}
