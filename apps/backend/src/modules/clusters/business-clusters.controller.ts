import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { User, UserRole } from '../users/entities/user.entity';
import { BusinessClustersService } from './business-clusters.service';
import {
  BranchScopeDto,
  ClusterChatQueryDto,
  ClusterMembersQueryDto,
  ProposeClusterDto,
  SendClusterMessageDto,
  ShowcasePreferenceDto,
  UpdateShowcaseDto,
} from './dto/business-cluster.dto';

interface BusinessRequest {
  user: User;
}

const ACCESS =
  'Acts for `branchId` (a branch of the caller’s business) or the caller’s own branch. Access: OWNER, MANAGER.';

@ApiTags('Business Clusters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('business/clusters')
export class BusinessClustersController {
  constructor(private readonly clusters: BusinessClustersService) {}

  @Get('detect')
  @ApiOperation({
    summary: 'Find the cluster for my branch',
    description: `\`already_joined\` (its cluster), \`detected\` (nearest active cluster whose radius covers the branch) or \`not_found\`. ${ACCESS}`,
  })
  detect(@Req() req: BusinessRequest, @Query() query: BranchScopeDto) {
    return this.clusters.detect(req.user, query.branchId);
  }

  @Get('mine')
  @ApiOperation({
    summary: 'My branch’s cluster',
    description: `The cluster, its QR, member/deal counts and this branch’s membership. 404 when not in a cluster. ${ACCESS}`,
  })
  mine(@Req() req: BusinessRequest, @Query() query: BranchScopeDto) {
    return this.clusters.mine(req.user, query.branchId);
  }

  @Post()
  @ApiOperation({
    summary: 'Propose a new cluster',
    description: `Creates it under review (inactive until an admin approves) and joins the branch to it. 409 when a cluster already covers the spot or has the name. ${ACCESS}`,
  })
  @ApiResponse({
    status: 409,
    description: 'An existing cluster covers this spot',
  })
  propose(@Req() req: BusinessRequest, @Body() dto: ProposeClusterDto) {
    return this.clusters.propose(req.user, dto);
  }

  @Post('leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave my branch’s cluster', description: ACCESS })
  leave(@Req() req: BusinessRequest, @Body() dto: BranchScopeDto) {
    return this.clusters.leave(req.user, dto.branchId);
  }

  @Get('showcase')
  @ApiOperation({
    summary: 'What my branch shows in its cluster',
    description: `Live deals (shown by default) and active products/services (hidden by default), each with \`showInCluster\`. ${ACCESS}`,
  })
  showcase(@Req() req: BusinessRequest, @Query() query: BranchScopeDto) {
    return this.clusters.showcase(req.user, query.branchId);
  }

  @Put('showcase')
  @ApiOperation({
    summary: 'Show or hide items in the cluster (bulk)',
    description: `Hidden deals leave the cluster feed and the rotator. Ids that are not the business’s own are ignored (counted in \`ignored\`). ${ACCESS}`,
  })
  updateShowcase(@Req() req: BusinessRequest, @Body() dto: UpdateShowcaseDto) {
    return this.clusters.updateShowcase(req.user, dto);
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'What my branch features in the cluster',
    description: ACCESS,
  })
  setPreference(
    @Req() req: BusinessRequest,
    @Body() dto: ShowcasePreferenceDto,
  ) {
    return this.clusters.setPreference(req.user, dto);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join a cluster',
    description: `Active clusters, or one under review that this business proposed (else 404). Idempotent. ${ACCESS}`,
  })
  join(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BranchScopeDto,
  ) {
    return this.clusters.join(req.user, id, dto.branchId);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Members of my cluster',
    description: `Paginated, searchable by name, each with its live deal count. 403 unless the branch is a member. ${ACCESS}`,
  })
  members(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ClusterMembersQueryDto,
  ) {
    return this.clusters.members(req.user, id, query);
  }

  @Get(':id/members/:branchId')
  @ApiOperation({
    summary: 'A member’s profile card and top deals',
    description: ACCESS,
  })
  member(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('branchId', ParseUUIDPipe) memberBranchId: string,
    @Query() query: BranchScopeDto,
  ) {
    return this.clusters.member(req.user, id, memberBranchId, query.branchId);
  }

  @Get(':id/chats/:branchId')
  @ApiOperation({
    summary: 'My conversation with another member',
    description: `Newest first; page back with \`before\`. Marks their messages read. ${ACCESS}`,
  })
  chat(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('branchId', ParseUUIDPipe) otherBranchId: string,
    @Query() query: ClusterChatQueryDto,
  ) {
    return this.clusters.chat(req.user, id, otherBranchId, query);
  }

  @Post(':id/chats/:branchId')
  @ApiOperation({ summary: 'Message another member', description: ACCESS })
  send(
    @Req() req: BusinessRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('branchId', ParseUUIDPipe) otherBranchId: string,
    @Body() dto: SendClusterMessageDto,
  ) {
    return this.clusters.send(req.user, id, otherBranchId, dto);
  }
}
