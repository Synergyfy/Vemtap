import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { BusinessDashboardService } from './business-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BusinessDashboardResponseDto } from './dto/business-dashboard.dto';
import type { Request } from 'express';

@ApiTags('Business Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('business-dashboard')
export class BusinessDashboardController {
  constructor(private readonly dashboardService: BusinessDashboardService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get business dashboard data (stats, visitors, devices, etc.)',
    description:
      'Full dashboard payload. `stats` carries lifetime totals plus 7-day ' +
      'deltas (visitors/claims/revenue), `weekly` the last-7-day aggregates, ' +
      '`insights` rules-based growth tips and `generatedAt` the payload time. ' +
      'Optional `branchId` narrows visit/claim/revenue figures to one branch.',
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Business dashboard payload',
    type: BusinessDashboardResponseDto,
  })
  async getDashboard(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
  ): Promise<BusinessDashboardResponseDto> {
    const businessId = (req as any).user.businessId;
    return this.dashboardService.getDashboard(businessId, branchId);
  }
}
