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

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
    @Permissions('dashboard')
    @ApiOperation({ summary: 'Get primary analytics dashboard stats' })
    @ApiResponse({ status: 200, description: 'Analytics summary' })
    getDashboardAnalytics(@Request() req, @Query('branchId') branchId?: string) {
        return this.analyticsService.getDashboardAnalytics(branchId, req.user);
    }

    @Get('footfall')
    @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
    @Permissions('analytics')
    @ApiOperation({ summary: 'Get footfall analytics' })
    @ApiResponse({ status: 200, description: 'Footfall stats' })
    getFootfallAnalytics(@Request() req, @Query('branchId') branchId?: string) {
        return this.analyticsService.getFootfallAnalytics(branchId, req.user);
    }

    @Get('peak-times')
    @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
    @Permissions('analytics')
    @ApiOperation({ summary: 'Get peak times analytics' })
    @ApiResponse({ status: 200, description: 'Peak times stats' })
    getPeakTimesAnalytics(@Request() req, @Query('branchId') branchId?: string) {
        return this.analyticsService.getPeakTimesAnalytics(branchId, req.user);
    }

    // --- Admin Endpoints ---

    @Get('admin/loyalty/stats')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get loyalty metrics and ecosystem stats' })
    @ApiResponse({
        status: 200,
        description: 'Ecosystem stats, alerts, and sector split',
    })
    getAdminLoyaltyStats() {
        return this.analyticsService.getAdminLoyaltyStats();
    }
}
