import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosForecastingController } from './fos-forecasting.controller';
import { FosForecastingService } from './fos-forecasting.service';
import { ForecastScenario } from './entities/forecast-scenario.entity';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [TypeOrmModule.forFeature([ForecastScenario]), FosCoreModule],
  controllers: [FosForecastingController],
  providers: [FosForecastingService],
  exports: [FosForecastingService],
})
export class FosForecastingModule {}
