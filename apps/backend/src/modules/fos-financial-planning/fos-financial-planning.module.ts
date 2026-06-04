import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosFinancialPlanningController } from './fos-financial-planning.controller';
import { FosFinancialPlanningService } from './fos-financial-planning.service';
import { FinancialTarget } from './entities/financial-target.entity';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialTarget]), FosCoreModule],
  controllers: [FosFinancialPlanningController],
  providers: [FosFinancialPlanningService],
  exports: [FosFinancialPlanningService],
})
export class FosFinancialPlanningModule {}
