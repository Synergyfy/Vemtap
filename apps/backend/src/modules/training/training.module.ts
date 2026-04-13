import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingCourse } from './entities/course.entity';
import { TrainingLesson } from './entities/lesson.entity';
import { TrainingService } from './training.service';
import { TrainingController } from './training.controller';
import { AffiliateProfile } from '../affiliates/entities/affiliate-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingCourse,
      TrainingLesson,
      AffiliateProfile,
    ]),
  ],
  providers: [TrainingService],
  controllers: [TrainingController],
  exports: [TrainingService],
})
export class TrainingModule {}
