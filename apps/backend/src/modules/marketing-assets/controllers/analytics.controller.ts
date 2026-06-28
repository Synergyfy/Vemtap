import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Query,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { User } from '../../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Marketing Analytics')
@ApiBearerAuth()
@Controller('marketing-analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('track/:assetId')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Log a scan or view event from QR codes (Public endpoint)',
  })
  track(
    @Param('assetId') assetId: string,
    @Query('businessId') businessId: string,
    @Query('type') type: 'scan' | 'view',
  ) {
    return this.analyticsService.trackEvent(
      assetId,
      businessId,
      type || 'scan',
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('overview')
  @ApiOperation({ summary: 'Get aggregated 30-day dashboard overview stats' })
  getOverview(@Req() req: RequestWithUser) {
    return this.analyticsService.getBusinessOverview(req.user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('asset/:id')
  @ApiOperation({ summary: 'Get granular historical analytics by asset ID' })
  getAssetStats(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getAssetPerformance(
      id,
      req.user,
      startDate,
      endDate,
    );
  }
}
