import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosRecordsController } from './fos-records.controller';
import { FosRecordsService } from './fos-records.service';
import { FosRecord } from './entities/record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FosRecord])],
  controllers: [FosRecordsController],
  providers: [FosRecordsService],
  exports: [FosRecordsService],
})
export class FosRecordsModule {}
