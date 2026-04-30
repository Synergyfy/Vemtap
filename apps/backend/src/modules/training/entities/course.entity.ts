import { Entity, Column, OneToMany } from 'typeorm';
import { AbstractBaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { TrainingLesson } from './lesson.entity';

@Entity('training_courses')
export class TrainingCourse extends AbstractBaseEntity {
  @ApiProperty({ example: 'Affiliate Marketing 101' })
  @Column()
  title: string;

  @ApiProperty({
    example: 'Learn the basics of affiliate marketing with Vemtap.',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: 'https://cdn.example.com/course-thumbnail.png',
    nullable: true,
  })
  @Column({ nullable: true })
  thumbnailUrl: string;

  @ApiProperty({ example: 1 })
  @Column({ default: 0 })
  order: number;

  @ApiProperty({ example: 'Beginner' })
  @Column({ default: 'Beginner' })
  level: string;

  @ApiProperty({ example: '2 hours' })
  @Column({ nullable: true })
  duration: string;

  @ApiProperty({ example: [{ scenario: '...', options: [] }] })
  @Column({ type: 'json', nullable: true })
  scenarios: any[];

  @ApiProperty({ example: [{ question: '...', options: [], correct: 0 }] })
  @Column({ type: 'json', nullable: true })
  quiz: any[];

  @OneToMany(() => TrainingLesson, (lesson) => lesson.course)
  lessons: TrainingLesson[];
}
