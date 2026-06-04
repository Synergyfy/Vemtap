import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosRevenueAnalyticsService } from './fos-revenue-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  RevenueTransactionsQueryDto,
  ChartDataQueryDto,
  BusinessIdParamDto,
  TransactionsListResponseDto,
  RevenueAggregatesResponseDto,
  RevenueTrendDto,
  RevenueChartDataResponseDto,
  BusinessRevenueHistoryResponseDto,
} from './dto/revenue-analytics.dto';
import { DateRangeQueryDto } from '../fos-core/dto/create-financial-transaction.dto';

@ApiTags('FOS Revenue Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('revenue')
export class FosRevenueAnalyticsController {
  constructor(
    private readonly revenueService: FosRevenueAnalyticsService,
  ) {}

  @Get('transactions')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get paginated, filtered revenue transactions' })
  async getTransactions(
    @Query(new ValidationPipe({ transform: true }))
    query: RevenueTransactionsQueryDto,
  ): Promise<TransactionsListResponseDto> {
    return this.revenueService.getTransactions(query);
  }

  @Get('aggregates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get summary financial aggregates' })
  async getAggregates(): Promise<RevenueAggregatesResponseDto> {
    return this.revenueService.getAggregates();
  }

  @Get('trends')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get daily revenue and profit trends for area chart',
  })
  async getTrends(
    @Query(new ValidationPipe({ transform: true }))
    query: DateRangeQueryDto,
  ): Promise<RevenueTrendDto[]> {
    return this.revenueService.getTrends(query.startDate, query.endDate);
  }

  @Get('chart-data')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get server-computed chart data for platform and type charts',
  })
  async getChartData(
    @Query(new ValidationPipe({ transform: true }))
    query: ChartDataQueryDto,
  ): Promise<RevenueChartDataResponseDto> {
    return this.revenueService.getChartData(query);
  }

  @Get('business/:businessId/history')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get full transaction history for a specific business' })
  async getBusinessHistory(
    @Param() params: BusinessIdParamDto,
  ): Promise<BusinessRevenueHistoryResponseDto> {
    return this.revenueService.getBusinessHistory(params.businessId);
  }
}
