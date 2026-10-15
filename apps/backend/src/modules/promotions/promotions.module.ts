import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SponsoredCampaign } from '../discovery/entities/sponsored-campaign.entity';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';
import { AdWalletModule } from '../ad-wallet/ad-wallet.module';
import { PromotionsService } from './promotions.service';
import {
  BoostsController,
  PromotionsController,
} from './promotions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SponsoredCampaign, SponsoredCampaignTransaction]),
    AdWalletModule,
  ],
  controllers: [BoostsController, PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
