import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessProfile } from './entities/business-profile.entity';
import { BusinessProfilingService } from './business-profiling.service';
import { BusinessProfilingController } from './business-profiling.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessProfile])],
  controllers: [BusinessProfilingController],
  providers: [BusinessProfilingService],
  exports: [BusinessProfilingService],
})
export class BusinessProfilingModule {}
