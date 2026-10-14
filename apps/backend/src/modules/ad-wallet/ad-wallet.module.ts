import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsModule } from '../payments/payments.module';
import { AdWallet } from './entities/ad-wallet.entity';
import { AdWalletTransaction } from './entities/ad-wallet-transaction.entity';
import { AdWalletService } from './ad-wallet.service';
import { AdWalletController } from './ad-wallet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdWallet, AdWalletTransaction]),
    PaymentsModule,
  ],
  controllers: [AdWalletController],
  providers: [AdWalletService],
  exports: [AdWalletService],
})
export class AdWalletModule {}
