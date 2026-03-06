import {
  BadRequestException,
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  AdminSummaryResponseDto,
  DashboardAnalyticsResponseDto,
  FootfallAnalyticsResponseDto,
  PeakTimesAnalyticsResponseDto,
} from './dto/analytics-responses.dto';

import { BranchFilterDto } from '../../common/dto/branch-filter.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('dashboard')
  @ApiOperation({ summary: 'Get primary analytics dashboard stats' })
  @ApiOkResponse({
    description: 'Analytics summary',
    type: DashboardAnalyticsResponseDto,
  })
  getDashboardAnalytics(
    @Request() req,
    @Query() filter: BranchFilterDto,
  ): Promise<DashboardAnalyticsResponseDto> {
    return this.analyticsService.getDashboardAnalytics(
      filter.branchId,
      req.user,
    );
  }

  @Get('footfall')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('analytics')
  @ApiOperation({ summary: 'Get footfall analytics' })
  @ApiOkResponse({
    description: 'Footfall stats',
    type: FootfallAnalyticsResponseDto,
  })
  getFootfallAnalytics(
    @Request() req,
    @Query() filter: BranchFilterDto,
  ): Promise<FootfallAnalyticsResponseDto> {
    return this.analyticsService.getFootfallAnalytics(
      filter.branchId,
      req.user,
    );
  }

  @Get('peak-times')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @Permissions('analytics')
  @ApiOperation({ summary: 'Get peak times analytics' })
  @ApiOkResponse({
    description: 'Peak times stats',
    type: PeakTimesAnalyticsResponseDto,
  })
  getPeakTimesAnalytics(
    @Request() req,
    @Query() filter: BranchFilterDto,
  ): Promise<PeakTimesAnalyticsResponseDto> {
    return this.analyticsService.getPeakTimesAnalytics(
      filter.branchId,
      req.user,
    );
  }

  // --- Admin Endpoints ---

  @Get('admin/summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get comprehensive platform summary' })
  @ApiOkResponse({
    description: 'Platform stats, growth trend, and sector split',
    type: AdminSummaryResponseDto,
  })
  getAdminSummary(): Promise<AdminSummaryResponseDto> {
    return this.analyticsService.getAdminSummary();
  }
}
