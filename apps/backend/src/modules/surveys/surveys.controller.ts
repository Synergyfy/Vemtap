import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { UpdateSurveyDto } from './dto/update-survey.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('surveys')
@ApiBearerAuth()
@Controller('surveys')
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get survey settings for the business' })
  async findOne(@Request() req) {
    const survey = await this.surveysService.findByBusiness(
      req.user.businessId,
    );
    return survey || {}; // Return empty object if no survey yet? Or maybe 404? Frontend probably handles null/empty.
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
      req.user.businessId,
      createSurveyDto,
    );
  }

  @Patch()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Partially update survey settings' })
  @ApiBody({ type: UpdateSurveyDto })
  async update(@Request() req, @Body() updateSurveyDto: UpdateSurveyDto) {
    return this.surveysService.createOrUpdate(
      req.user.businessId,
      updateSurveyDto,
    );
  }
}
