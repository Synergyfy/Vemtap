import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosLedgerService } from './fos-ledger.service';
import { FosReceivablesController } from './receivables.controller';
import { FosPayablesController } from './payables.controller';
import { FosCoreModule } from '../fos-core/fos-core.module';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Business } from '../businesses/entities/business.entity';
import { FosInvoice } from './entities/invoice.entity';
import { FosBill } from './entities/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Business, FosInvoice, FosBill]),
    FosCoreModule,
  ],
  controllers: [FosReceivablesController, FosPayablesController],
  providers: [FosLedgerService],
  exports: [FosLedgerService],
})
export class FosLedgerModule {}
