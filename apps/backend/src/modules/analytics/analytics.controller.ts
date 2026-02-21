import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    @Roles(UserRole.OWNER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get primary analytics dashboard stats' })
    @ApiResponse({ status: 200, description: 'Analytics summary' })
    getDashboardAnalytics(@Request() req) {
        return this.analyticsService.getDashboardAnalytics();
    }

    @Get('footfall')
    @Roles(UserRole.OWNER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get footfall analytics' })
    @ApiResponse({ status: 200, description: 'Footfall stats' })
    getFootfallAnalytics(@Request() req) {
        return this.analyticsService.getFootfallAnalytics();
    }

    @Get('peak-times')
    @Roles(UserRole.OWNER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get peak times analytics' })
    @ApiResponse({ status: 200, description: 'Peak times stats' })
    getPeakTimesAnalytics(@Request() req) {
        return this.analyticsService.getPeakTimesAnalytics();
    }

    // --- Admin Endpoints ---

    @Get('admin/loyalty/stats')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Admin: Get loyalty metrics and ecosystem stats' })
    @ApiResponse({ status: 200, description: 'Ecosystem stats, alerts, and sector split' })
    getAdminLoyaltyStats() {
        return this.analyticsService.getAdminLoyaltyStats();
    }
}
