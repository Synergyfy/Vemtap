import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingCourse } from './entities/course.entity';
import { TrainingLesson } from './entities/lesson.entity';
import { AffiliateProfile } from '../affiliates/entities/affiliate-profile.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingCourse)
    private readonly courseRepository: Repository<TrainingCourse>,
    @InjectRepository(TrainingLesson)
    private readonly lessonRepository: Repository<TrainingLesson>,
    @InjectRepository(AffiliateProfile)
    private readonly profileRepository: Repository<AffiliateProfile>,
  ) {}

  async findAllCourses(): Promise<TrainingCourse[]> {
    return this.courseRepository.find({
      relations: ['lessons'],
      order: { order: 'ASC' },
    });
  }

  async findCourseById(id: string): Promise<TrainingCourse> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['lessons'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async markLessonAsComplete(userId: string, lessonId: string): Promise<void> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Affiliate profile not found');

    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');

    if (!profile.completedModules) {
      profile.completedModules = [];
    }

    if (!profile.completedModules.includes(lessonId)) {
      profile.completedModules.push(lessonId);
      await this.profileRepository.save(profile);
    }
  }

  async createCourse(data: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const course = this.courseRepository.create(data);
    return this.courseRepository.save(course);
  }

  async updateCourse(id: string, data: Partial<TrainingCourse>): Promise<TrainingCourse> {
    const course = await this.findCourseById(id);
    Object.assign(course, data);
    return this.courseRepository.save(course);
  }

  async deleteCourse(id: string): Promise<void> {
    const result = await this.courseRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Course not found');
  }

  // --- Lesson Management ---

  async createLesson(courseId: string, data: Partial<TrainingLesson>): Promise<TrainingLesson> {
    const course = await this.findCourseById(courseId);
    const lesson = this.lessonRepository.create({
      ...data,
      courseId: course.id,
    });
    return this.lessonRepository.save(lesson);
  }

  async updateLesson(id: string, data: Partial<TrainingLesson>): Promise<TrainingLesson> {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, data);
    return this.lessonRepository.save(lesson);
  }

  async deleteLesson(id: string): Promise<void> {
    const result = await this.lessonRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Lesson not found');
  }
}
