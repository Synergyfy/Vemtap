import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
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
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Get business dashboard data (stats, visitors, devices, etc.)',
  })
  @ApiQuery({ name: 'branchId', required: false })
  async getDashboard(
    @Req() req: Request,
    @Query('branchId') branchId?: string,
  ): Promise<BusinessDashboardResponseDto> {
    const businessId = (req as any).user.businessId;
    return this.dashboardService.getDashboard(businessId, branchId);
  }
}
