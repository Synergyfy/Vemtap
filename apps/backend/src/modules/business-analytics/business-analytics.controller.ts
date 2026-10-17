import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BusinessAnalyticsService } from './business-analytics.service';
import { BusinessAnalyticsExportService } from './business-analytics-export.service';
import {
  AnalyticsExportDto,
  AnalyticsRangeQueryDto,
} from './dto/analytics-range.dto';

interface BusinessRequest {
  user: { businessId: string };
}

const RANGE_NOTE =
  'Range: `from` (default 30 days before `to`) to `to` (exclusive, default now), at most 366 days; ' +
  'every comparison is against the previous period of the same length. `branchId` limits to one ' +
  'branch of the business (404 for another business). Amounts are NGN; ratios are 0–1.';

@ApiTags('Business Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Permissions('analytics')
@Controller('business-analytics')
export class BusinessAnalyticsController {
  constructor(
    private readonly analytics: BusinessAnalyticsService,
    private readonly exporter: BusinessAnalyticsExportService,
  ) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Business overview: revenue, orders, customers, activity, trends',
    description:
      'Revenue/orders from POS sales and catalogue orders (a POS-paid order counts once), ' +
      'activity from visits, claims, saves, chats and reviews, a daily series with the ' +
      'previous period aligned, hourly and weekday volume, top deal, top items and ' +
      'sales per cashier. ' +
      RANGE_NOTE,
  })
  @ApiResponse({ status: 200, description: 'Overview for the period' })
  overview(
    @Req() req: BusinessRequest,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.analytics.getOverview(req.user.businessId, query);
  }

  @Get('customers')
  @ApiOperation({
    summary: 'Customer analytics: totals, segments, growth, top customers',
    description:
      'Customers are signed-in users with any touch at the business (purchase, visit, ' +
      'booking, claim, save, chat). Segments use the POS thresholds (VIP ≥10 visits or ' +
      '≥₦100,000; new = first touch in the last 30 days; lapsed = none in 60 days). ' +
      RANGE_NOTE,
  })
  @ApiResponse({
    status: 200,
    description: 'Customer analytics for the period',
  })
  customers(
    @Req() req: BusinessRequest,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.analytics.getCustomers(req.user.businessId, query);
  }

  @Get('deals')
  @ApiOperation({
    summary: 'Deal leaderboard and redemption funnel',
    description:
      'One row per deal (branch copies of a deal are grouped). Claims and redemptions ' +
      'are for the period; views and likes are lifetime counters. ' +
      RANGE_NOTE,
  })
  @ApiResponse({ status: 200, description: 'Deal analytics for the period' })
  deals(@Req() req: BusinessRequest, @Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getDeals(req.user.businessId, query);
  }

  @Get('pos')
  @ApiOperation({
    summary:
      'POS analytics: sales, tickets, hourly rhythm, tenders, items, cashiers',
    description:
      'Split payments are broken down by their parts. Drawer variance sums the counted ' +
      'register sessions opened in the period. ' +
      RANGE_NOTE,
  })
  @ApiResponse({ status: 200, description: 'POS analytics for the period' })
  pos(@Req() req: BusinessRequest, @Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.getPos(req.user.businessId, query);
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Per-branch comparison: revenue, orders, visits, claims, rating',
    description:
      'Every branch of the business, ranked by revenue, with share of revenue and ' +
      'percent of the best branch, plus the business-wide activity heatmap. ' +
      RANGE_NOTE,
  })
  @ApiResponse({ status: 200, description: 'Branch comparison for the period' })
  locations(
    @Req() req: BusinessRequest,
    @Query() query: AnalyticsRangeQueryDto,
  ) {
    return this.analytics.getLocations(req.user.businessId, query);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export an analytics report as CSV or PDF',
    description:
      'Builds the chosen sections (default: all) for the period and returns the file ' +
      'base64-encoded with its name and MIME type. ' +
      RANGE_NOTE,
  })
  @ApiResponse({
    status: 200,
    description:
      '{ filename, mimeType, contentBase64, sizeBytes, records, modules, range }',
  })
  export(@Req() req: BusinessRequest, @Body() dto: AnalyticsExportDto) {
    return this.exporter.export(req.user.businessId, dto);
  }
}
