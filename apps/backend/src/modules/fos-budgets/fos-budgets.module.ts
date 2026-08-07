import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosBudgetsController } from './fos-budgets.controller';
import { FosBudgetsService } from './fos-budgets.service';
import { Budget } from './entities/budget.entity';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [TypeOrmModule.forFeature([Budget]), FosCoreModule],
  controllers: [FosBudgetsController],
  providers: [FosBudgetsService],
  exports: [FosBudgetsService],
})
export class FosBudgetsModule {}
