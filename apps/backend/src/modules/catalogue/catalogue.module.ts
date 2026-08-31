import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogueService } from './catalogue.service';
import { AdminCatalogueController } from './admin-catalogue.controller';
import { PublicCatalogueController } from './public-catalogue.controller';
import { CatalogueCategory } from './entities/catalogue-category.entity';
import { CatalogueItem } from './entities/catalogue-item.entity';
import { CatalogueOffer } from './entities/catalogue-offer.entity';
import { Branch } from '../branches/entities/branch.entity';
import { CatalogueOfferService } from './catalogue-offer.service';
import { CatalogueOfferController } from './catalogue-offer.controller';
import { AdminDealsController } from './admin-deals.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CatalogueOfferClaim } from './entities/catalogue-offer-claim.entity';
import { Otp } from '../auth/entities/otp.entity';
import { MailModule } from '../mail/mail.module';
import { AiCopilotModule } from '../ai-copilot/ai-copilot.module';
import { Business } from '../businesses/entities/business.entity';
import { ClustersModule } from '../clusters/clusters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CatalogueCategory,
      CatalogueItem,
      CatalogueOffer,
      CatalogueOfferClaim,
      Branch,
      Business,
      Otp,
    ]),
    SubscriptionsModule,
    MailModule,
    AiCopilotModule,
    ClustersModule,
  ],
  controllers: [
    AdminCatalogueController,
    PublicCatalogueController,
    CatalogueOfferController,
    AdminDealsController,
  ],
  providers: [CatalogueService, CatalogueOfferService],
  exports: [CatalogueService, CatalogueOfferService],
})
export class CatalogueModule {}
