import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosGoalsController } from './fos-goals.controller';
import { FosGoalsService } from './fos-goals.service';
import { Goal, Project } from './entities/goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, Project])],
  controllers: [FosGoalsController],
  providers: [FosGoalsService],
  exports: [FosGoalsService],
})
export class FosGoalsModule {}
