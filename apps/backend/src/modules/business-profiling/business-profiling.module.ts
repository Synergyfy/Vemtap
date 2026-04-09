import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessProfilingService } from './business-profiling.service';
import { BusinessProfilingController } from './business-profiling.controller';
import { BusinessProfile } from './entities/business-profile.entity';
import { GeminiService } from './gemini.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessProfile])],
  controllers: [BusinessProfilingController],
  providers: [BusinessProfilingService, GeminiService],
  exports: [BusinessProfilingService],
})
export class BusinessProfilingModule {}
