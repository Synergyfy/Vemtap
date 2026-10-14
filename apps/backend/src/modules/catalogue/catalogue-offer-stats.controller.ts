import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CatalogueOfferStatsService } from './catalogue-offer-stats.service';

const RANGE_DOC = {
  from: {
    name: 'from',
    required: false,
    description: 'ISO date; defaults to 29 days before `to`',
  },
  to: { name: 'to', required: false, description: 'ISO date; defaults to now' },
};

@ApiTags('Catalogue Offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN, UserRole.STAFF)
@Permissions('inventory')
@Controller('catalogue/offers')
export class CatalogueOfferStatsController {
  constructor(private readonly statsService: CatalogueOfferStatsService) {}

  @Get('summary')
  @ApiOperation({
    summary: "Deals hub header: live deals, today's claims, 30-day revenue",
  })
  @ApiQuery({ name: 'branchId', required: false })
  async summary(@Req() req: any, @Query('branchId') branchId?: string) {
    return this.statsService.getSummary(
      req.user.businessId,
      branchId || undefined,
    );
  }

  @Get('groups/:dealGroupId/stats')
  @ApiOperation({ summary: 'Performance of a deal across all its branches' })
  @ApiQuery(RANGE_DOC.from)
  @ApiQuery(RANGE_DOC.to)
  async groupStats(
    @Param('dealGroupId', ParseUUIDPipe) dealGroupId: string,
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getGroupStats(dealGroupId, req.user.businessId, {
      from,
      to,
    });
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Performance of one offer (one branch)' })
  @ApiQuery(RANGE_DOC.from)
  @ApiQuery(RANGE_DOC.to)
  async offerStats(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.statsService.getOfferStats(id, req.user.businessId, {
      from,
      to,
    });
  }
}
