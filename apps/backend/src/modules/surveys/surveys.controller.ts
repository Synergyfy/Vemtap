import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('surveys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  private getBranchId(req: any): string {
    const branchId = req.user?.branchId;
    if (!branchId) {
      throw new BadRequestException('User must be associated with a branch');
    }
    return branchId;
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get survey settings for the branch' })
  async findOne(@Request() req) {
    const survey = await this.surveysService.findByBranch(
      this.getBranchId(req),
    );
    return survey || {};
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create or update survey settings' })
  @ApiBody({ type: CreateSurveyDto })
  async createOrUpdate(
    @Request() req,
    @Body() createSurveyDto: CreateSurveyDto,
  ) {
    return this.surveysService.createOrUpdate(
      this.getBranchId(req),
      createSurveyDto,
    );
  }

  @Patch()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Partially update survey settings' })
  @ApiBody({ type: UpdateSurveyDto })
  async update(@Request() req, @Body() updateSurveyDto: UpdateSurveyDto) {
    return this.surveysService.createOrUpdate(
      this.getBranchId(req),
      updateSurveyDto,
    );
  }
}
