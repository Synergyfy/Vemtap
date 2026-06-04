import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosPnlController } from './fos-pnl.controller';
import { ExpensesController } from './expenses.controller';
import { FosPnlService } from './fos-pnl.service';
import { FosCoreModule } from '../fos-core/fos-core.module';
import { MetricsSnapshot } from '../fos-dashboard/entities/metrics-snapshot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MetricsSnapshot]), FosCoreModule],
  controllers: [FosPnlController, ExpensesController],
  providers: [FosPnlService],
  exports: [FosPnlService],
})
export class FosPnlModule {}
