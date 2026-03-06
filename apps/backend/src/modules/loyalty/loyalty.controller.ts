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
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyRewardDto } from './dto/create-reward.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { RedeemRewardDto } from './dto/redeem-reward.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { BranchFilterDto } from '../../common/dto/branch-filter.dto';

@ApiTags('Loyalty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('analytics')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get customer analytics (visits, points, savings)' })
  async getAnalytics(@Request() req) {
    return this.loyaltyService.getAnalytics(req.user.id);
  }

  @Get('check-visit/:businessId')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Check if current customer has visited a business' })
  async checkVisit(
    @Request() req,
    @Param('businessId') businessId: string,
  ): Promise<{ hasVisited: boolean }> {
    const hasVisited = await this.loyaltyService.checkVisit(
      req.user.id,
      businessId,
    );
    return { hasVisited };
  }

  @Post('tap/:code')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Process a device tap (Record visit/earn points)' })
  async tap(@Request() req, @Param('code') code: string) {
    return this.loyaltyService.processTap(req.user.id, code);
  }

  @Public()
  @Get('device-info/:code')
  @ApiOperation({ summary: 'Get public details of a device by its code' })
  @ApiResponse({
    status: 200,
    description: 'Device details retrieved successfully',
    schema: {
      example: {
        id: '270f20d0-7a0a-4a2a-9e0a-0a2a4b2b4c2b',
        name: 'Main Entrance Scanner',
        code: 'VT-8829',
        type: 'NFCCard',
        business: {
          id: '8829-uuid',
          name: 'VemTap Headquarters',
        },
        branch: {
          id: 'branch-1-uuid',
          name: 'Lagos Office',
        },
        owner: {
          firstName: 'John',
          lastName: 'Doe',
          engagement: {
            instagram: {
              profile: 'johndoe',
              link: 'https://instagr.am/johndoe',
            },
          },
        },
        isFirstTimeVisit: true,
      },
    },
  })
  async getDeviceInfo(@Request() req: any, @Param('code') code: string) {
    const userId = req.user?.id;
    return this.loyaltyService.getDeviceByCode(code, userId);
  }

  @Get('business-stats')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get aggregate loyalty stats for the business' })
  async getBusinessStats(@Request() req, @Query() filter?: BranchFilterDto) {
    return this.loyaltyService.getBusinessLoyaltyStats(
      req.user.businessId,
      filter?.branchId,
    );
  }

  @Get('profile')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty profile for current user' })
  @ApiQuery({ name: 'businessId', required: false })
  async getProfile(
    @Request() req,
    @Query('businessId') businessId?: string,
    @Query() filter?: BranchFilterDto,
  ) {
    if (businessId) {
      return this.loyaltyService.getProfile(
        req.user.id,
        businessId,
        filter?.branchId,
      );
    }
    return this.loyaltyService.getAllProfiles(req.user.id);
  }

  @Get('history')
  @Roles(UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Get loyalty transaction history' })
  @ApiQuery({ name: 'businessId', required: false })
  async getHistory(
    @Request() req,
    @Query('businessId') businessId?: string,
    @Query() filter?: BranchFilterDto,
  ) {
    return this.loyaltyService.getHistory(
      req.user.id,
      businessId,
      filter?.branchId,
    );
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
  @ApiOperation({ summary: 'Get available rewards for a business' })
  @ApiQuery({ name: 'businessId', required: true })
  async getRewards(
    @Query('businessId') businessId: string,
    @Query() filter?: BranchFilterDto,
  ) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    return this.loyaltyService.getRewards(businessId, filter?.branchId);
  }

  @Post('redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Redeem a reward' })
  async redeemReward(
    @Request() req,
    @Body() dto: RedeemRewardDto,
    @Query('businessId') businessId: string,
  ) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    return this.loyaltyService.redeemReward(
      req.user.id,
      businessId,
      dto.rewardId,
    );
  }

  // --- Staff/Admin Endpoints ---

  @Post('earn')
  @Roles(UserRole.STAFF, UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN) // Restricted to staff
  @ApiOperation({ summary: 'Manually add points to a user (Staff only)' })
  @ApiQuery({ name: 'businessId', required: true })
  async earnPoints(
    @Body() dto: EarnPointsDto,
    @Query('businessId') businessId: string,
    @Query() filter?: BranchFilterDto,
  ) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    return this.loyaltyService.earnPoints(businessId, dto, filter?.branchId);
  }

  @Post('rewards/create')
  @Roles(UserRole.MANAGER, UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new reward (Manager/Owner only)' })
  @ApiQuery({ name: 'businessId', required: true })
  async createReward(
    @Body() dto: CreateLoyaltyRewardDto,
    @Query('businessId') businessId: string,
    @Query() filter?: BranchFilterDto,
  ) {
    if (!businessId) throw new BadRequestException('Business ID is required');
    return this.loyaltyService.createReward(businessId, dto, filter?.branchId);
  }
}
