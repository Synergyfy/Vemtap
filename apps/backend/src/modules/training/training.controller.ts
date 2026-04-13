import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Training')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get()
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'List all training courses' })
  async getCourses() {
    return this.trainingService.findAllCourses();
  }

  @Get(':id')
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get course details' })
  async getCourse(@Param('id') id: string) {
    return this.trainingService.findCourseById(id);
  }

  @Post('lessons/:id/complete')
  @Roles(UserRole.AGENT)
  @ApiOperation({ summary: 'Mark a lesson as complete' })
  async completeLesson(@Param('id') id: string, @Req() req) {
    return this.trainingService.markLessonAsComplete(req.user.id, id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a training course' })
  async createCourse(@Body() data: any) {
    return this.trainingService.createCourse(data);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update a training course' })
  async updateCourse(@Param('id') id: string, @Body() data: any) {
    return this.trainingService.updateCourse(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a training course' })
  async deleteCourse(@Param('id') id: string) {
    return this.trainingService.deleteCourse(id);
  }

  // --- Lesson Admin Endpoints ---

  @Post(':id/lessons')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Add a lesson to a course' })
  async addLesson(@Param('id') id: string, @Body() data: any) {
    return this.trainingService.createLesson(id, data);
  }

  @Patch('lessons/:lessonId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Update a lesson' })
  async updateLesson(@Param('lessonId') lessonId: string, @Body() data: any) {
    return this.trainingService.updateLesson(lessonId, data);
  }

  @Delete('lessons/:lessonId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Delete a lesson' })
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.trainingService.deleteLesson(lessonId);
  }
}
