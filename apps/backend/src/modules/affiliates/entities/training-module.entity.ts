import { Entity, Column } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum TrainingModuleType {
  VIDEO = 'video',
  ARTICLE = 'article',
  BOTH = 'both',
  QUIZ = 'quiz',
}

export enum TrainingModuleStatus {
  PUBLISHED = 'Published',
  DRAFT = 'Draft',
}

@Entity('affiliate_training_modules')
export class AffiliateTrainingModule extends AbstractBaseEntity {
  @ApiProperty({ example: 'Vemtap 101' })
  @Column()
  title: string;

  @ApiProperty({ example: 'An introduction to the Vemtap platform' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ enum: TrainingModuleType, default: TrainingModuleType.ARTICLE })
  @Column({
    type: 'simple-enum',
    enum: TrainingModuleType,
    default: TrainingModuleType.ARTICLE,
  })
  type: TrainingModuleType;

  @ApiProperty({ example: 'https://youtube.com/watch?v=...' })
  @Column({ nullable: true })
  videoUrl: string;

  @ApiProperty({ example: '# Introduction\nWelcome to Vemtap!' })
  @Column({ type: 'text', nullable: true })
  articleContent: string;

  @ApiProperty({ example: '5 mins' })
  @Column({ nullable: true })
  duration: string;

  @ApiProperty({ enum: TrainingModuleStatus, default: TrainingModuleStatus.DRAFT })
  @Column({
    type: 'simple-enum',
    enum: TrainingModuleStatus,
    default: TrainingModuleStatus.DRAFT,
  })
  status: TrainingModuleStatus;

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ example: { questions: [] }, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  quizData: any;
}
