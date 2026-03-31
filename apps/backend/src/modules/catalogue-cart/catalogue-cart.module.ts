import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueCartService } from './catalogue-cart.service';
import { CatalogueCartController } from './catalogue-cart.controller';
import { CatalogueCart } from './entities/catalogue-cart.entity';
import { CatalogueCartItem } from './entities/catalogue-cart-item.entity';
import { CatalogueItem } from '../catalogue/entities/catalogue-item.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { User } from '../users/entities/user.entity';
import { CatalogueOrderModule } from '../catalogue-orders/catalogue-orders.module';
import { CatalogueModule } from '../catalogue/catalogue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueCart,
      CatalogueCartItem,
      CatalogueItem,
      CatalogueOffer,
      Branch,
      User,
    ]),
    forwardRef(() => CatalogueOrderModule),
    forwardRef(() => CatalogueModule),
  ],
  providers: [CatalogueCartService],
  controllers: [CatalogueCartController],
  exports: [CatalogueCartService],
})
export class CatalogueCartModule {}
