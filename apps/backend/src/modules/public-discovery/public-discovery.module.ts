import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicDiscoveryService } from './public-discovery.service';
import { PublicDiscoveryController } from './public-discovery.controller';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Category } from '../businesses/entities/category.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import { CatalogueOfferClaim } from '../catalogue/entities/catalogue-offer-claim.entity';
import { CatalogueModule } from '../catalogue/catalogue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Business,
      Branch,
      Category,
      CatalogueOffer,
      CatalogueOfferClaim,
    ]),
    CatalogueModule,
  ],
  controllers: [PublicDiscoveryController],
  providers: [PublicDiscoveryService],
})
export class PublicDiscoveryModule {}
