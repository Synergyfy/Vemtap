import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { ClustersService } from './clusters.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  ClusterDealsQueryDto,
  ClusterDealsSortBy,
} from './dto/cluster-deals-query.dto';
import {
  CreateClusterDto,
  UpdateClusterDto,
  AdminClusterQueryDto,
  AutoAssignClustersDto,
  AddBranchDto,
} from './dto/cluster.dto';
import {
  ClusterOffersQueryDto,
  SetClusterOfferPinnedDto,
} from './dto/cluster-offer.dto';

@ApiTags('Clusters (Public)')
@Controller('clusters')
export class ClustersPublicController {
  constructor(private readonly clustersService: ClustersService) {}

  @Public()
  @Get('context/:uniqueCode')
  @ApiOperation({
    summary: 'Resolve a cluster QR code scan',
    description:
      'Returns the cluster (name, QR URL, member branches) for a scanned cluster QR code. ' +
      'Returns qrActive=false when the QR has been deactivated by an admin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cluster context resolved',
  })
  @ApiResponse({ status: 404, description: 'Cluster QR code not found' })
  getContext(@Param('uniqueCode') uniqueCode: string) {
    return this.clustersService.getContext(uniqueCode);
  }

  @Public()
  @Get(':uniqueCode/deals')
  @ApiOperation({
    summary: 'Get deals available in a cluster',
    description:
      'Lists active deals from all branches in the cluster. Supports filters (category, search) ' +
      'and sorting (fair rotation, newest, price asc/desc, distance asc/desc). ' +
      'Fair rotation is the default and rotates which branch leads every 15 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cluster deals retrieved',
    schema: {
      example: {
        active: true,
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        sortBy: ClusterDealsSortBy.FAIR,
        seed: 12345,
        bucket: 67482,
        reference: { lat: 9.0489, lng: 7.4894, source: 'cluster_center' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cluster QR code not found' })
  getDeals(
    @Param('uniqueCode') uniqueCode: string,
    @Query() query: ClusterDealsQueryDto,
  ) {
    return this.clustersService.getClusterDeals(uniqueCode, query);
  }
}

@ApiTags('Clusters (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/clusters')
export class ClustersAdminController {
  constructor(private readonly clustersService: ClustersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: List market clusters' })
  list(@Query() query: AdminClusterQueryDto) {
    return this.clustersService.list(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get cluster detail with member branches' })
  detail(@Param('id') id: string) {
    return this.clustersService.getDetail(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Create a market cluster' })
  create(@Body() dto: CreateClusterDto, @Req() req: any) {
    return this.clustersService.create(dto, req.user?.id);
  }

  @Post('auto-assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Auto-assign branches to clusters',
    description:
      'scope=unassigned (default) assigns only branches without a cluster to the nearest ' +
      'covering cluster. scope=all also considers already-assigned branches and reassigns them ' +
      'to a different, closer covering cluster (never unassigns). Use dryRun=true to preview ' +
      'without persisting, or async=true to enqueue the run on the background worker and return immediately.',
  })
  autoAssign(@Body() dto: AutoAssignClustersDto) {
    return this.clustersService.autoAssign(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Update cluster (incl. activate/deactivate QR)',
    description:
      'Set qrIsActive=false to deactivate the cluster QR code (scans then report qrActive=false).',
  })
  update(@Param('id') id: string, @Body() dto: UpdateClusterDto) {
    return this.clustersService.update(id, dto);
  }

  @Get(':id/offers')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: List auto-matched and pinned offers for a cluster',
    description:
      'Returns offers that automatically appear for the cluster (from member branches) ' +
      'plus the offers an admin has explicitly pinned.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cluster offers retrieved',
    schema: {
      example: {
        autoMatched: [],
        pinned: [],
        total: 0,
      },
    },
  })
  getOffers(@Param('id') id: string, @Query() query: ClusterOffersQueryDto) {
    return this.clustersService.getClusterOffers(id, query);
  }

  @Patch(':id/offers/:offerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Admin: Pin or unpin an offer for a cluster',
    description:
      'Pinned offers always appear in the cluster deals feed and are ranked first.',
  })
  @ApiResponse({
    status: 200,
    description: 'Offer pin state updated',
    schema: { example: { pinned: true, offerId: 'uuid', clusterId: 'uuid' } },
  })
  setOfferPinned(
    @Param('id') id: string,
    @Param('offerId') offerId: string,
    @Body() dto: SetClusterOfferPinnedDto,
    @Req() req: any,
  ) {
    return this.clustersService.setOfferPinned(id, offerId, dto, req.user?.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Soft-delete a market cluster' })
  remove(@Param('id') id: string) {
    return this.clustersService.remove(id);
  }

  @Post(':id/branches')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Add a branch to a cluster' })
  addBranch(@Param('id') id: string, @Body() dto: AddBranchDto) {
    return this.clustersService.addBranch(id, dto.branchId);
  }

  @Delete(':id/branches/:branchId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Remove a branch from a cluster' })
  removeBranch(@Param('id') id: string, @Param('branchId') branchId: string) {
    return this.clustersService.removeBranch(id, branchId);
  }
}
