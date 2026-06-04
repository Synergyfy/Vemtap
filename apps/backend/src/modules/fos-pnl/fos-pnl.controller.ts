import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FosPnlService } from './fos-pnl.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CreateCashFlowDto } from './dto/create-cashflow.dto';
import { ListCashFlowsQueryDto } from './dto/list-cashflows-query.dto';

@ApiTags('FOS PnL')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pnl')
export class FosPnlController {
  constructor(private readonly pnlService: FosPnlService) {}

  // === Existing Endpoints (unchanged) ===

  @Get('break-even')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get break-even analysis data (legacy)' })
  async getBreakEven() {
    return this.pnlService.getBreakEven();
  }

  @Get('runway')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cash runway analysis (legacy)' })
  async getRunway() {
    return this.pnlService.getRunway();
  }

  // === New: P&L Statement ===

  @Get('statement')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get profit and loss statement' })
  async getPnlStatement() {
    return this.pnlService.getPnlStatement();
  }

  // === New: Monthly Revenue Trends ===

  @Get('revenue-trends')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get monthly revenue and profit trends' })
  async getRevenueTrends() {
    return this.pnlService.getRevenueTrends();
  }

  // === New: Cash Flows ===

  @Get('cashflows')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List cash flows with pagination and optional type filter' })
  async listCashflows(@Query() query: ListCashFlowsQueryDto) {
    return this.pnlService.listCashflows(query);
  }

  @Post('cashflows')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a cash flow entry' })
  async createCashflow(@Body() dto: CreateCashFlowDto) {
    return this.pnlService.createCashflow(dto);
  }

  // === New: Cash Flow Runway ===

  @Get('cashflow-runway')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cash flow runway analysis from cash_flows table' })
  async getCashFlowRunway() {
    return this.pnlService.getCashFlowRunway();
  }

  // === New: Cost Break-Even ===

  @Get('cost-break-even')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cost-based break-even analysis from expenses and cash_flows' })
  async getCostBreakEven() {
    return this.pnlService.getCostBreakEven();
  }
}
