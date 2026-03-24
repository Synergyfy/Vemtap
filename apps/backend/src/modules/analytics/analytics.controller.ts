import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AnalyticsLevelGuard } from '../subscriptions/guards/analytics-level.guard';
import { RequireAnalyticsLevel } from '../subscriptions/decorators/analytics-level.decorator';
import { BusinessSummaryResponseDto } from './dto/analytics-responses.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, AnalyticsLevelGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
  @Permissions('analytics')
  @RequireAnalyticsLevel('basic')
  @ApiOperation({ summary: 'Get main dashboard analytics' })
  async getDashboardAnalytics(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    return this.analyticsService.getDashboardAnalytics(
      req.user,
      filter.branchId,
    );
  }

  @Get('footfall')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('analytics')
  @RequireAnalyticsLevel('advanced')
  @ApiOperation({ summary: 'Get footfall (visits) analytics' })
  async getFootfallAnalytics(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    return this.analyticsService.getFootfallAnalytics(
      req.user,
      filter.branchId,
    );
  }

  @Get('peak-times')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @Permissions('analytics')
  @RequireAnalyticsLevel('advanced')
  @ApiOperation({ summary: 'Get peak visit hours and days' })
  async getPeakTimesAnalytics(
    @Request() req: { user: User },
    @Query() filter: BranchFilterDto,
  ) {
    return this.analyticsService.getPeakTimesAnalytics(
      req.user,
      filter.branchId,
    );
  }

  @Get('admin/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Global platform summary for super admins' })
  async getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }

  @Get('admin/business-summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Detailed business status summary for super admins',
  })
  @ApiResponse({
    status: 200,
    description: 'Business summary data',
    type: BusinessSummaryResponseDto,
  })
  async getBusinessSummary() {
    return this.analyticsService.getBusinessSummary();
  }
}
