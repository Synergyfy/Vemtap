import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BusinessDashboardService } from './business-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessDashboardResponseDto } from './dto/business-dashboard.dto';
import type { Request } from 'express';

@ApiTags('Business Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business-dashboard')
export class BusinessDashboardController {
  constructor(private readonly dashboardService: BusinessDashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get business dashboard data (stats, visitors, devices, etc.)' })
  @ApiQuery({ name: 'branchId', required: false })
  async getDashboard(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
  ): Promise<BusinessDashboardResponseDto> {
    const businessId = (req as any).user.businessId;
    return this.dashboardService.getDashboard(businessId, branchId);
  }
}
