import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosGoalsService } from './fos-goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  CreateGoalDto,
  UpdateGoalDto,
  CreateProjectDto,
  UpdateProjectDto,
} from './dto/goal.dto';

@ApiTags('FOS Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('goals')
export class FosGoalsController {
  constructor(private readonly goalsService: FosGoalsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List goals and projects' })
  async getGoals() {
    return this.goalsService.getGoals();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new goal' })
  async createGoal(@Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a goal' })
  async updateGoal(@Param('id') id: string, @Body() dto: UpdateGoalDto) {
    return this.goalsService.updateGoal(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a goal' })
  async removeGoal(@Param('id') id: string) {
    return this.goalsService.removeGoal(id);
  }

  @Post('projects')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new project' })
  async createProject(@Body() dto: CreateProjectDto) {
    return this.goalsService.createProject(dto);
  }

  @Patch('projects/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a project' })
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.goalsService.updateProject(id, dto);
  }

  @Delete('projects/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a project' })
  async removeProject(@Param('id') id: string) {
    return this.goalsService.removeProject(id);
  }
}
