import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { SavingsService } from './savings.service';
import {
  MySavingsPageDto,
  MySavingsQueryDto,
  SavingsBreakdownDto,
  SavingsCategoriesQueryDto,
  SavingsExportQueryDto,
} from './dto/savings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('Customer Savings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('me/savings')
export class MeSavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: "List the customer's redemption ledger",
    description:
      'Paginated history of the customer’s redeemed deal passes with the ' +
      'amounts saved (original item sum vs deal price). `totalSavedAmount` ' +
      'covers every matching redemption, not just the page. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: MySavingsPageDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user is not a CUSTOMER',
  })
  async listMySavings(
    @Req() req: RequestWithUser,
    @Query() query: MySavingsQueryDto,
  ): Promise<MySavingsPageDto> {
    return this.savingsService.getMySavings(req.user, query);
  }

  @Get('categories')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Savings by category',
    description:
      'Rollup of the customer’s redemption savings grouped by the business ' +
      'category, with each category’s share of total savings. Access: CUSTOMER',
  })
  @ApiResponse({ status: 200, type: SavingsBreakdownDto })
  async listCategories(
    @Req() req: RequestWithUser,
    @Query() query: SavingsCategoriesQueryDto,
  ): Promise<SavingsBreakdownDto> {
    return this.savingsService.getMySavingsCategories(req.user, query.days);
  }

  @Get('export')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Export the savings ledger as CSV',
    description:
      'Returns the full redemption ledger as a `text/csv` attachment. Access: CUSTOMER',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  async exportCsv(
    @Req() req: RequestWithUser,
    @Query() query: SavingsExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    if (query.format && query.format !== 'csv') {
      throw new BadRequestException('Only csv export is supported');
    }

    const csv = await this.savingsService.exportMySavingsCsv(
      req.user,
      query.days,
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="vemtap-savings-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }
}
