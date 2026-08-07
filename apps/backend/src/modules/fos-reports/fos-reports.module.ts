import { Module } from '@nestjs/common';
import { FosReportsController } from './fos-reports.controller';
import { FosReportsService } from './fos-reports.service';
import { FosCoreModule } from '../fos-core/fos-core.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../businesses/entities/business.entity';

@Module({
  imports: [FosCoreModule, TypeOrmModule.forFeature([Business])],
  controllers: [FosReportsController],
  providers: [FosReportsService],
  exports: [FosReportsService],
})
export class FosReportsModule {}
