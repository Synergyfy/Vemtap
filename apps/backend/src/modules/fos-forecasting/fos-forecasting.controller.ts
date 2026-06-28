import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosForecastingService } from './fos-forecasting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ForecastProjectionRequestDto,
  SaveForecastRequestDto,
} from './dto/forecasting.dto';

@ApiTags('FOS Forecasting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forecasting')
export class FosForecastingController {
  constructor(private readonly forecastingService: FosForecastingService) {}

  @Post('project')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Run a forecast projection' })
  async project(@Body() dto: ForecastProjectionRequestDto) {
    return this.forecastingService.project(dto);
  }

  @Post('persist')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Save a forecast scenario' })
  async persist(@Body() dto: SaveForecastRequestDto) {
    return this.forecastingService.persist(dto);
  }

  @Get('history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get saved forecast history' })
  async getHistory() {
    return this.forecastingService.getHistory();
  }
}
