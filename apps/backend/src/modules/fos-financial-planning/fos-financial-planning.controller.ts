import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosFinancialPlanningService } from './fos-financial-planning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  CreateTargetDto,
  TargetFilterDto,
  ScenarioSimulationRequestDto,
} from './dto/financial-planning.dto';

@ApiTags('FOS Financial Planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('financial-planning')
export class FosFinancialPlanningController {
  constructor(private readonly planningService: FosFinancialPlanningService) {}

  @Post('targets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new budget target' })
  async createTarget(@Body() dto: CreateTargetDto) {
    return this.planningService.createTarget(dto);
  }

  @Get('targets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get saved budget targets' })
  async getTargets(@Query() filter: TargetFilterDto) {
    return this.planningService.getTargets(filter);
  }

  @Post('scenarios')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Simulate financial scenarios (best/expected/worst)',
  })
  async simulateScenario(@Body() dto: ScenarioSimulationRequestDto) {
    return this.planningService.simulateScenario(dto);
  }
}
