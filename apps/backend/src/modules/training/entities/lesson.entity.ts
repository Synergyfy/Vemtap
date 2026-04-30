import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { TrainingCourse } from './course.entity';

@Entity('training_lessons')
export class TrainingLesson extends AbstractBaseEntity {
  @ManyToOne(() => TrainingCourse, (course) => course.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: TrainingCourse;

  @ApiProperty({ example: 'uuid-string' })
  @Column({ type: 'uuid' })
  courseId: string;

  @ApiProperty({ example: 'Introduction to Commissions' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'In this lesson, you will learn how commissions are calculated.',
  })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ example: 'https://youtube.com/watch?v=123', nullable: true })
  @Column({ nullable: true })
  videoUrl: string;

  @ApiProperty({ example: ['Takeaway 1', 'Takeaway 2'] })
  @Column('simple-array', { nullable: true })
  summary: string[];

  @ApiProperty({ example: '5 mins', nullable: true })
  @Column({ nullable: true })
  duration: string;

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order: number;
}
