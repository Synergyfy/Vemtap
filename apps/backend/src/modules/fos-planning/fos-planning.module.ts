import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosPlanningController } from './fos-planning.controller';
import { FosPlanningService } from './fos-planning.service';
import {
  FosBudgetItem,
  FosBudgetCategory,
  FosForecastAspect,
} from './entities/planning.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FosBudgetItem,
      FosBudgetCategory,
      FosForecastAspect,
    ]),
  ],
  controllers: [FosPlanningController],
  providers: [FosPlanningService],
  exports: [FosPlanningService],
})
export class FosPlanningModule {}
