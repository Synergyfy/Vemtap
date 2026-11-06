import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { AdWallet } from './entities/ad-wallet.entity';
import { AdWalletTransaction } from './entities/ad-wallet-transaction.entity';
import { AdWalletService } from './ad-wallet.service';
import { AdWalletController } from './ad-wallet.controller';
import { AdWalletInvoicesService } from './ad-wallet-invoices.service';
import { SponsoredCampaignTransaction } from '../discovery/entities/sponsored-campaign-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdWallet,
      AdWalletTransaction,
      SponsoredCampaignTransaction,
    ]),
    PaymentsModule,
  ],
  controllers: [AdWalletController],
  providers: [AdWalletService, AdWalletInvoicesService],
  exports: [AdWalletService],
})
export class AdWalletModule {}
