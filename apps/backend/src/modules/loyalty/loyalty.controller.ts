import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { LoyaltyService } from './loyalty.service';
import {
  EarnPointsDto,
  RedeemRewardDto,
  CreateLoyaltyRewardDto,
} from '../campaigns/dto/loyalty.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BranchFilterDto } from '../../common/dto/branch-filter.dto';
import { CapabilityGuard } from '../subscriptions/guards/capability.guard';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';

@ApiTags('Loyalty & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  private async getBranchId(req: any, queryBranchId?: string): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request for write operations
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins for write operations',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.loyaltyService.checkBranchAccess(
          user,
          queryBranchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return queryBranchId;
    }

    // For Manager and Staff: ignore queryBranchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  private async getResolvedContext(
    req: any,
    filter: BranchFilterDto,
  ): Promise<{ branchId?: string; businessId?: string }> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (filter.allBranches) {
        if (user.role === UserRole.OWNER) {
          return { businessId: user.businessId };
        }
        return {
          businessId: user.businessId || (req.query.businessId as string),
        };
      }

      if (filter.branchId) {
        if (user.role === UserRole.OWNER) {
          const hasAccess = await this.loyaltyService.checkBranchAccess(
            user,
            filter.branchId,
          );
          if (!hasAccess)
            throw new BadRequestException('Access denied to this branch');
        }
        return { branchId: filter.branchId };
      }

      throw new BadRequestException(
        'Either branchId or allBranches must be provided for Owners and Admins',
      );
    }

    return { branchId: user.branchId };
  }

  @Get('analytics')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get customer analytics (visits, points, savings)' })
  async getAnalytics(@Request() req) {
    return this.loyaltyService.getAnalytics(req.user.id);
  }

  @Get('check-visit/:branchId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Check if current customer has visited a branch' })
  async checkVisit(
    @Request() req,
    @Param('branchId') branchId: string,
  ): Promise<{ hasVisited: boolean }> {
    const hasVisited = await this.loyaltyService.checkVisit(
      req.user.id,
      branchId,
    );
    return { hasVisited };
  }

  @Public()
  @Post('tap/:code')
  @ApiOperation({ summary: 'Process a device tap (Record visit/earn points)' })
  async tap(@Request() req: any, @Param('code') code: string) {
    const userId = req.user?.id;
    return this.loyaltyService.processTap(userId, code);
  }

  @Public()
  @Get('device-info/:code')
  @ApiOperation({ summary: 'Get public details of a device by its code' })
  @ApiResponse({
    status: 200,
    description: 'Device details retrieved successfully',
  })
  async getDeviceInfo(@Request() req: any, @Param('code') code: string) {
    const userId = req.user?.id;
    return this.loyaltyService.getDeviceByCode(code, userId);
  }

  @Get('business-stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get aggregate loyalty stats for the branch' })
  async getBusinessStats(@Request() req, @Query() filter?: BranchFilterDto) {
    const context = await this.getResolvedContext(req, filter || {});
    return this.loyaltyService.getBusinessLoyaltyStats(
      context.branchId,
      context.businessId,
    );
  }

  @Get('profile')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty profile for current user' })
  @ApiQuery({ name: 'branchId', required: false })
  async getProfile(@Request() req, @Query() filter?: BranchFilterDto) {
    if (filter?.allBranches || filter?.branchId || req.user.branchId) {
      const context = await this.getResolvedContext(req, filter || {});
      return this.loyaltyService.getProfile(
        req.user.id,
        context.branchId,
        context.businessId,
      );
    }
    return this.loyaltyService.getAllProfiles(req.user.id);
  }

  @Get('history')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty transaction history' })
  @ApiQuery({ name: 'branchId', required: false })
  async getHistory(@Request() req, @Query() filter?: BranchFilterDto) {
    return this.loyaltyService.getHistory(req.user.id, filter?.branchId);
  }

  @Get('my-history')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get global loyalty history for the current customer',
  })
  async getMyHistory(@Request() req) {
    return this.loyaltyService.getHistory(req.user.id);
  }

  @Get('rewards')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get available rewards for a branch' })
  @ApiQuery({ name: 'branchId', required: true })
  async getRewards(@Query() filter: BranchFilterDto, @Request() req) {
    const context = await this.getResolvedContext(req, filter);
    return this.loyaltyService.getRewards(context.branchId, context.businessId);
  }

  @Post('redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Redeem a reward' })
  async redeemReward(
    @Request() req,
    @Body() dto: RedeemRewardDto,
    @Query('branchId') branchId: string,
  ) {
    const targetBranchId = await this.getBranchId(req, branchId);
    return this.loyaltyService.redeemReward(
      req.user.id,
      targetBranchId,
      dto.rewardId,
    );
  }

  // --- Staff/Admin Endpoints ---

  @Post('earn')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually add points to a user (Staff only)' })
  @ApiQuery({ name: 'branchId', required: true })
  async earnPoints(
    @Body() dto: EarnPointsDto,
    @Request() req,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.loyaltyService.earnPoints(branchId, dto);
  }

  @Post('rewards/create')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @UseGuards(CapabilityGuard)
  @RequireCapability('loyaltyPrograms')
  @ApiOperation({ summary: 'Create a new reward (Manager/Owner only)' })
  @ApiQuery({ name: 'branchId', required: true })
  async createReward(
    @Body() dto: CreateLoyaltyRewardDto,
    @Request() req,
    @Query() filter: BranchFilterDto,
  ) {
    const branchId = await this.getBranchId(req, filter.branchId);
    return this.loyaltyService.createReward(branchId, dto);
  }
}
