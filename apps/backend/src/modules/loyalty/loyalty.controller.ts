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
  Patch,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { LoyaltyService, CustomerAnalyticsResponse, BusinessLoyaltyStatsResponse } from './loyalty.service';
import {
  EarnPointsDto,
  RedeemRewardDto,
  CreateLoyaltyRewardDto,
  UpdateLoyaltyRuleDto,
  BranchQueryDto,
  GenerateRedemptionCodeDto,
  ClaimCodeDto,
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
import { CapabilityGuard } from '../subscriptions/guards/capability.guard';
import { RequireCapability } from '../subscriptions/decorators/capability.decorator';
import { LoyaltyProfile } from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { LoyaltyRule } from '../campaigns/entities/loyalty-rule.entity';

@ApiTags('Loyalty & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  private async getBranchId(req: { user: User }, queryBranchId?: string): Promise<string> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!queryBranchId) {
        throw new BadRequestException('branchId is required for Owners and Admins');
      }
      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.loyaltyService.checkBranchAccess(user, queryBranchId);
        if (!hasAccess) throw new BadRequestException('Access denied to this branch');
      }
      return queryBranchId;
    }

    if (!user.branchId) throw new BadRequestException('User is not associated with any branch');
    return user.branchId;
  }

  private async getResolvedContext(
    req: { user: User },
    filter: BranchQueryDto,
  ): Promise<{ branchId?: string; businessId?: string }> {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (filter.allBranches || !filter.branchId) {
        return { businessId: user.businessId };
      }
      if (filter.branchId) {
        if (user.role === UserRole.OWNER) {
          const hasAccess = await this.loyaltyService.checkBranchAccess(user, filter.branchId);
          if (!hasAccess) throw new BadRequestException('Access denied to this branch');
        }
        return { branchId: filter.branchId };
      }
    }

    return { branchId: user.branchId };
  }

  @Get('analytics')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get customer loyalty analytics' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  async getAnalytics(@Request() req: { user: User }): Promise<CustomerAnalyticsResponse> {
    return this.loyaltyService.getAnalytics(req.user.id);
  }

  @Get('business-stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get aggregate loyalty stats for branch/business' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getBusinessStats(@Request() req: { user: User }, @Query() filter: BranchQueryDto): Promise<BusinessLoyaltyStatsResponse> {
    const context = await this.getResolvedContext(req, filter);
    return this.loyaltyService.getBusinessLoyaltyStats(context.branchId, context.businessId);
  }

  @Get('profile')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty profile for current user' })
  async getProfile(@Request() req: { user: User }, @Query() filter: BranchQueryDto): Promise<LoyaltyProfile | LoyaltyProfile[]> {
    if (filter.allBranches || filter.branchId || req.user.branchId) {
      const context = await this.getResolvedContext(req, filter);
      return this.loyaltyService.getProfile(req.user.id, context.branchId, context.businessId);
    }
    return this.loyaltyService.getAllProfiles(req.user.id);
  }

  @Get('history')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty transaction history' })
  async getHistory(@Request() req: { user: User }, @Query() filter: BranchQueryDto): Promise<any[]> {
    const context = await this.getResolvedContext(req, filter);
    return this.loyaltyService.getHistory(req.user.id, context.branchId, context.businessId);
  }

  @Get('rewards')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get available rewards' })
  async getRewards(@Request() req: { user: User }, @Query() filter: BranchQueryDto): Promise<Reward[]> {
    const context = await this.getResolvedContext(req, filter);
    return this.loyaltyService.getRewards(context.branchId, context.businessId);
  }

  @Get('templates')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get loyalty program templates' })
  async getTemplates() {
    return this.loyaltyService.getLoyaltyTemplates();
  }

  @Post('templates')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new loyalty template (System Admin only)' })
  async createTemplate(@Body() data: any) {
    return this.loyaltyService.createLoyaltyTemplate(data);
  }

  @Patch('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a loyalty template (System Admin only)' })
  async updateTemplate(@Param('id') id: string, @Body() data: any) {
    return this.loyaltyService.updateLoyaltyTemplate(id, data);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a loyalty template (System Admin only)' })
  async deleteTemplate(@Param('id') id: string) {
    return this.loyaltyService.deleteLoyaltyTemplate(id);
  }

  @Post('templates/:id/apply')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Apply a loyalty template to a branch' })
  async applyTemplate(
    @Param('id') id: string,
    @Request() req: { user: User },
    @Query('branchId') branchId?: string,
  ) {
    const targetBranchId = await this.getBranchId(req, branchId);
    return this.loyaltyService.applyLoyaltyTemplate(targetBranchId, id);
  }

  @Post('generate-code')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Staff/Owner generates a 9-digit code for a reward' })
  async generateCode(@Request() req: { user: User }, @Body() dto: GenerateRedemptionCodeDto): Promise<Redemption> {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.loyaltyService.generateRedemptionCode(branchId, dto, req.user.id);
  }

  @Post('claim-code')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer claims a reward using a 9-digit code' })
  async claimCode(@Request() req: { user: User }, @Body() dto: ClaimCodeDto): Promise<any> {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.loyaltyService.claimRedemptionCode(req.user.id, branchId, dto.code);
  }

  @Post('redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer-initiated redemption using points' })
  async redeemReward(@Request() req: { user: User }, @Body() dto: RedeemRewardDto): Promise<Redemption> {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.loyaltyService.redeemReward(req.user.id, branchId, dto.rewardId);
  }

  @Get('rules')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty rules' })
  async getRules(@Request() req: { user: User }, @Query() filter: BranchQueryDto): Promise<LoyaltyRule> {
    const context = await this.getResolvedContext(req, filter);
    return this.loyaltyService.getLoyaltyRule(context.branchId, context.businessId);
  }

  @Patch('rules')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Update loyalty rules' })
  async updateRules(@Request() req: { user: User }, @Body() dto: UpdateLoyaltyRuleDto, @Query('branchId') branchId?: string): Promise<LoyaltyRule> {
    const targetBranchId = await this.getBranchId(req, branchId);
    return this.loyaltyService.updateLoyaltyRule(targetBranchId, dto);
  }

  @Post('earn')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Manually award points to a customer' })
  async earnPoints(@Request() req: { user: User }, @Body() dto: EarnPointsDto): Promise<any> {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.loyaltyService.earnPoints(branchId, dto);
  }

  @Post('rewards/create')
  @Roles(UserRole.MANAGER, UserRole.OWNER)
  @UseGuards(CapabilityGuard)
  @RequireCapability('loyaltyPrograms')
  @ApiOperation({ summary: 'Create a new reward' })
  async createReward(@Request() req: { user: User }, @Body() dto: CreateLoyaltyRewardDto): Promise<Reward> {
    const branchId = await this.getBranchId(req, dto.branchId);
    return this.loyaltyService.createReward(branchId, dto);
  }

  @Public()
  @Post('tap/:code')
  @ApiOperation({ summary: 'Process NFC/QR tap' })
  async tap(@Request() req: { user?: User }, @Param('code') code: string): Promise<any> {
    return this.loyaltyService.processTap(req.user?.id || '', code);
  }

  @Public()
  @Get('device-info/:code')
  @ApiOperation({ summary: 'Get device/branch info from code' })
  async getDeviceInfo(@Request() req: { user?: User }, @Param('code') code: string): Promise<any> {
    return this.loyaltyService.getDeviceByCode(code, req.user?.id);
  }
}
