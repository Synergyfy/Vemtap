import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosDashboardController } from './fos-dashboard.controller';
import { FosDashboardService } from './fos-dashboard.service';
import { MetricsSnapshot } from './entities/metrics-snapshot.entity';
import { FosCoreModule } from '../fos-core/fos-core.module';

@Module({
  imports: [TypeOrmModule.forFeature([MetricsSnapshot]), FosCoreModule],
  controllers: [FosDashboardController],
  providers: [FosDashboardService],
  exports: [FosDashboardService],
})
export class FosDashboardModule {}
