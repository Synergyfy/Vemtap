import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { Quote } from './entities/quote.entity';
import { QuoteNegotiation } from './entities/quote-negotiation.entity';
import { Order } from './entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Quote, QuoteNegotiation, Order])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }
