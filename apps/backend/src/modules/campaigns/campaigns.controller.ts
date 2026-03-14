import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import {
  CreateRewardDto,
  UpdateRewardDto,
  PointEarnRequestDto,
  RewardRedeemRequestDto,
  UpdateLoyaltyRuleDto,
  VerifyRedemptionDto,
  BranchQueryDto,
} from './dto/loyalty.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  private async getBranchId(
    req: { user: User },
    branchId?: string,
  ): Promise<string> {
    const user = req.user;

    // For Owner and Admin: branchId MUST be provided in the request
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (!branchId) {
        throw new BadRequestException(
          'branchId is required for Owners and Admins',
        );
      }

      if (user.role === UserRole.OWNER) {
        const hasAccess = await this.campaignsService.checkBranchAccess(
          user,
          branchId,
        );
        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this branch',
          );
        }
      }
      return branchId;
    }

    // For Manager and Staff: ignore provided branchId, always use branchId from token
    if (!user.branchId) {
      throw new BadRequestException('User is not associated with any branch');
    }

    return user.branchId;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({
    status: 201,
    description: 'The campaign has been successfully created.',
    type: Campaign,
  })
  async create(
    @Body() createCampaignDto: CreateCampaignDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || createCampaignDto.branchId,
    );
    return this.campaignsService.create(createCampaignDto, branchId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiQuery({ name: 'status', enum: CampaignStatus, required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'allBranches', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns',
    type: [Campaign],
  })
  async findAll(
    @Req() req: { user: User },
    @Query('status') status?: CampaignStatus,
    @Query() query?: BranchQueryDto,
  ) {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query?.allBranches || !query?.branchId) {
        if (user.role === UserRole.OWNER) {
          return this.campaignsService.findAll(undefined, status, user.businessId);
        }
        const businessId = user.businessId || query?.businessId;
        if (businessId) {
          return this.campaignsService.findAll(undefined, status, businessId);
        }
      }
    }

    const branchId = await this.getBranchId(req, query?.branchId);
    return this.campaignsService.findAll(branchId, status);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get campaign dashboard statistics' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'allBranches', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Dashboard statistics cards' })
  async getStats(@Req() req: { user: User }, @Query() query: BranchQueryDto) {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        if (user.role === UserRole.OWNER) {
          return this.campaignsService.getStats(undefined, user.businessId);
        }
        const businessId = user.businessId || query?.businessId;
        if (businessId) {
          return this.campaignsService.getStats(undefined, businessId);
        }
      }
    }

    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getStats(branchId);
  }

  @Get('scheduled')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get scheduled campaigns' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'allBranches', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled campaigns',
    type: [Campaign],
  })
  async getScheduled(
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        if (user.role === UserRole.OWNER) {
          return this.campaignsService.findAll(
            undefined,
            CampaignStatus.SCHEDULED,
            user.businessId,
          );
        }
        const businessId = user.businessId || query?.businessId;
        if (businessId) {
          return this.campaignsService.findAll(
            undefined,
            CampaignStatus.SCHEDULED,
            businessId,
          );
        }
      }
    }

    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.findAll(branchId, CampaignStatus.SCHEDULED);
  }

  @Get('templates')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get campaign templates' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'allBranches', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of campaign templates',
    type: [CampaignTemplate],
  })
  async getTemplates(
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        if (user.role === UserRole.OWNER) {
          return this.campaignsService.getTemplates(undefined, user.businessId);
        }
        const businessId = user.businessId || query?.businessId;
        if (businessId) {
          return this.campaignsService.getTemplates(undefined, businessId);
        }
      }
    }

    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getTemplates(branchId);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a campaign template' })
  @ApiResponse({
    status: 201,
    description: 'The template has been created.',
    type: CampaignTemplate,
  })
  async createTemplate(
    @Body() createTemplateDto: CreateCampaignTemplateDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId ?? createTemplateDto.branchId ?? undefined,
    );
    return this.campaignsService.createTemplate(createTemplateDto, branchId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get a campaign by ID' })
  @ApiResponse({
    status: 200,
    description: 'The campaign details',
    type: Campaign,
  })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiResponse({
    status: 200,
    description: 'The updated campaign',
    type: Campaign,
  })
  update(
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, updateCampaignDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign successfully deleted' })
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  // --- Loyalty Endpoints ---

  @Get('loyalty/profile/:userId')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get or create loyalty profile for user' })
  @ApiResponse({
    status: 200,
    description: 'The user loyalty profile',
    type: LoyaltyProfile,
  })
  async getLoyaltyProfile(
    @Param('userId') userId: string,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getLoyaltyProfile(userId, branchId);
  }

  @Get('loyalty/profiles')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({
    summary: 'Get all loyalty profiles for branch (Customer Directory)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all loyalty profiles',
    type: [LoyaltyProfile],
  })
  async getLoyaltyProfiles(
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getLoyaltyProfiles(branchId);
  }

  @Get('loyalty/rules')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get branch loyalty rules' })
  @ApiResponse({
    status: 200,
    description: 'The loyalty rules',
    type: LoyaltyRule,
  })
  async getLoyaltyRule(
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getLoyaltyRule(branchId);
  }

  @Patch('loyalty/rules')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update branch loyalty rules' })
  @ApiBody({ type: UpdateLoyaltyRuleDto })
  @ApiResponse({
    status: 200,
    description: 'Updated loyalty rules',
    type: LoyaltyRule,
  })
  async updateLoyaltyRule(
    @Body() updates: UpdateLoyaltyRuleDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.updateLoyaltyRule(branchId, updates);
  }

  @Get('loyalty/rewards')
  @Roles(
    UserRole.ADMIN,
    UserRole.OWNER,
    UserRole.MANAGER,
    UserRole.STAFF,
    UserRole.CUSTOMER,
  )
  @ApiOperation({ summary: 'Get all active rewards' })
  @ApiResponse({
    status: 200,
    description: 'List of rewards',
    type: [Reward],
  })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'allBranches', required: false, type: Boolean })
  async getRewards(@Req() req: { user: User }, @Query() query: BranchQueryDto) {
    const user = req.user;

    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
      if (query.allBranches || !query.branchId) {
        if (user.role === UserRole.OWNER) {
          return this.campaignsService.getRewards(undefined, user.businessId);
        }
        const businessId = user.businessId || query?.businessId;
        if (businessId) {
          return this.campaignsService.getRewards(undefined, businessId);
        }
        if (!query.branchId) {
          throw new BadRequestException(
            'Either branchId or businessId context must be available',
          );
        }
      }

      if (query.branchId) {
        if (user.role === UserRole.OWNER) {
          const hasAccess = await this.campaignsService.checkBranchAccess(
            user,
            query.branchId,
          );
          if (!hasAccess)
            throw new BadRequestException('Access denied to this branch');
        }
        return this.campaignsService.getRewards(query.branchId);
      }
    }

    // Default for Manager/Staff or if branchId provided for Admin/Owner handled above
    const branchId = await this.getBranchId(req, query.branchId);
    return this.campaignsService.getRewards(branchId);
  }

  @Post('loyalty/rewards')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new reward' })
  @ApiBody({ type: CreateRewardDto })
  @ApiResponse({
    status: 201,
    description: 'The created reward',
    type: Reward,
  })
  async createReward(
    @Body() dto: CreateRewardDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || dto.branchId,
    );
    return this.campaignsService.createReward(branchId, dto);
  }

  @Patch('loyalty/rewards/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a reward' })
  @ApiBody({ type: UpdateRewardDto })
  @ApiResponse({
    status: 200,
    description: 'The updated reward',
    type: Reward,
  })
  async updateReward(
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || dto.branchId,
    );
    return this.campaignsService.updateReward(branchId, id, dto);
  }

  @Post('loyalty/earn')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Earn points (Visit or Spend)' })
  @ApiBody({ type: PointEarnRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Points earned response',
    schema: {
      type: 'object',
      example: {
        success: true,
        pointsEarned: 150,
        newBalance: 1400,
        message: 'Congratulations! You earned 150 points.',
        breakdown: { visitPoints: 50, spendingPoints: 100 },
      },
    },
  })
  async earnPoints(
    @Body() dto: PointEarnRequestDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || dto.branchId,
    );
    return this.campaignsService.earnPoints(branchId, dto);
  }

  @Post('loyalty/redeem')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Redeem a reward' })
  @ApiBody({ type: RewardRedeemRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Redemption successful response',
    schema: {
      type: 'object',
      example: {
        success: true,
        redemption: {
          id: 'red_123',
          loyaltyProfileId: 'lp_123',
          rewardId: 'rew_123',
          redemptionCode: 'A1B2C3D4',
          pointsSpent: 500,
          status: 'pending',
        },
      },
    },
  })
  async redeemReward(
    @Body() dto: RewardRedeemRequestDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || dto.branchId,
    );
    return this.campaignsService.redeemReward(branchId, dto);
  }

  @Post('loyalty/verify-redemption')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Verify a customer redemption code' })
  @ApiBody({ type: VerifyRedemptionDto })
  @ApiResponse({
    status: 200,
    description: 'Verification result',
    schema: {
      type: 'object',
      example: {
        success: true,
        redemption: {
          id: 'red_123',
          status: 'verified',
          verifiedAt: '2024-03-10T15:00:00Z',
        },
      },
    },
  })
  async verifyRedemption(
    @Body() dto: VerifyRedemptionDto,
    @Req() req: { user: User },
    @Query() query: BranchQueryDto,
  ) {
    const branchId = await this.getBranchId(
      req,
      query.branchId || dto.branchId,
    );
    return this.campaignsService.verifyRedemption(branchId, dto.code);
  }

  @Get('loyalty/transactions/:profileId')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get transactions history for a profile' })
  @ApiResponse({
    status: 200,
    description: 'List of point transactions',
    type: [PointTransaction],
  })
  getTransactions(@Param('profileId') profileId: string) {
    return this.campaignsService.getTransactions(profileId);
  }
}
