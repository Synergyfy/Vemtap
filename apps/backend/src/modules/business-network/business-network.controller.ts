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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BusinessNetworkService } from './business-network.service';
import {
  DiscoveryQueryDto,
  ReferralsQueryDto,
} from './dto/referrals-query.dto';

interface BusinessRequest {
  user: { businessId: string };
}

@ApiTags('Business Network')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('business-network')
export class BusinessNetworkController {
  constructor(private readonly network: BusinessNetworkService) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Referral link, referral counts, milestone ladder and nearby merchants',
    description:
      'Referred businesses are those that signed up with this business code. Status: ' +
      'registered → pending (verification under review) → verified; notQualified when ' +
      'rejected or suspended. Milestones count verified referrals (3 / 5 / 10 / 25). ' +
      'Nearby merchants: active VemTap branches within 10 km of the main branch.',
  })
  @ApiResponse({ status: 200, description: 'Network summary' })
  summary(@Req() req: BusinessRequest) {
    return this.network.getSummary(req.user.businessId);
  }

  @Get('discovery')
  @ApiOperation({
    summary:
      'Discovery presence for a branch: feed card, health index, engagement, index, zones',
    description:
      'Default branch: the main one (`branchId` must belong to the business, else 404). The ' +
      'health index is 10 points per profile check (logo, cover, description, category, hours, ' +
      'location, catalogue, live deal, verified, discoverable). Engagement = visits, claims and ' +
      'saves at the branch over 7 days vs the 7 before. Toggle settings with ' +
      '`PATCH /discovery/settings/:branchId`.',
  })
  @ApiResponse({ status: 200, description: 'Discovery presence' })
  discovery(@Req() req: BusinessRequest, @Query() query: DiscoveryQueryDto) {
    return this.network.getDiscovery(req.user.businessId, query.branchId);
  }

  @Get('referrals')
  @ApiOperation({
    summary: 'Businesses this business referred, filterable by status',
  })
  @ApiResponse({
    status: 200,
    description:
      '{ data, total, page, limit, hasNextPage, meta: { statusCounts } }',
  })
  referrals(@Req() req: BusinessRequest, @Query() query: ReferralsQueryDto) {
    return this.network.getReferrals(req.user.businessId, query);
  }

  @Get('referrals/:businessId')
  @ApiOperation({
    summary: 'One referred business with its onboarding timeline',
    description: '404 unless the business signed up with this business code.',
  })
  @ApiResponse({ status: 200, description: 'Referral detail' })
  referral(
    @Req() req: BusinessRequest,
    @Param('businessId', ParseUUIDPipe) businessId: string,
  ) {
    return this.network.getReferral(req.user.businessId, businessId);
  }
}
