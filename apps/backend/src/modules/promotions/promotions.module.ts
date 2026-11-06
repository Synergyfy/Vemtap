import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsoredCampaign } from '../discovery/entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';
import { SponsoredCampaignEvent } from '../discovery/entities/sponsored-campaign-event.entity';
import { AdWalletModule } from '../ad-wallet/ad-wallet.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { SponsoredService } from './sponsored.service';
import { SponsoredController } from './sponsored.controller';
import { PromotionsService } from './promotions.service';
import {
  BoostsController,
  PromotionsController,
} from './promotions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SponsoredCampaign,
      SponsoredCampaignTransaction,
      SponsoredCampaignEvent,
    ]),
    AdWalletModule,
    CatalogueModule,
  ],
  controllers: [BoostsController, PromotionsController, SponsoredController],
  providers: [PromotionsService, SponsoredService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
