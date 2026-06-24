import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { BranchesService } from '../branches/branches.service';
import { UpdateDiscoverySettingsDto, RecommendBusinessDto, DiscoveryQueryDto } from './dto/discovery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly branchesService: BranchesService,
  ) {}

  @Get('overview/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Discovery Network Overview for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  @ApiResponse({ status: 200, description: 'Overview statistics and highlights retrieved successfully' })
  async getOverview(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getOverview(branchId);
  }

  @Get('results/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Discovery Network performance results/analytics' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  @ApiQuery({ name: 'range', required: false, enum: ['7days', 'month', 'year'], example: '7days' })
  async getResults(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Query('range') range: '7days' | 'month' | 'year' = '7days',
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getResults(branchId, range);
  }

  @Get('settings/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get Discovery Network settings for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getSettings(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getSettings(branchId);
  }

  @Patch('settings/:branchId')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update Discovery Network settings for a branch' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async updateSettings(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Body() dto: UpdateDiscoverySettingsDto,
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.updateSettings(branchId, dto);
  }

  @Get('partners/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get active partnership list with referral metrics' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getPartners(@Req() req: any, @Param('branchId') branchId: string) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.getPartners(branchId);
  }

  @Get('customers/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get list of customer visits driven by discovery referrals' })
  @ApiParam({ name: 'branchId', description: 'ID of the branch' })
  async getCustomers(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Query() query: DiscoveryQueryDto,
  ) {
    await this.validateAccess(req.user, branchId);
    const filter = query.filter || 'all';
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    return this.discoveryService.getCustomers(branchId, filter, page, limit);
  }

  @Post('recommend/:branchId')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Recommend a complementary business to join VemTap' })
  @ApiParam({ name: 'branchId', description: 'ID of the recommending branch' })
  async recommend(
    @Req() req: any,
    @Param('branchId') branchId: string,
    @Body() dto: RecommendBusinessDto,
  ) {
    await this.validateAccess(req.user, branchId);
    return this.discoveryService.submitRecommendation(branchId, dto);
  }

  private async validateAccess(user: any, branchId: string) {
    const hasAccess = await this.branchesService.checkBranchAccess(user, branchId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
