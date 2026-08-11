import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosDashboardService } from './fos-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FosEnvelope } from '../../common/decorators/fos-envelope.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('FOS Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@FosEnvelope()
@Controller('dashboard')
export class FosDashboardController {
  constructor(private readonly dashboardService: FosDashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get aggregate dashboard statistics' })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('snapshots')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get daily metrics snapshots for the last 30 days' })
  async getSnapshots() {
    return this.dashboardService.getSnapshots();
  }

  @Get('insights')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get intelligent alerts and performance insights' })
  async getInsights() {
    return this.dashboardService.getInsights();
  }
}
