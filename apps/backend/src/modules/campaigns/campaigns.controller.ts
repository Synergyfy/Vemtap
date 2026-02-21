import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import { CreateRewardDto, UpdateRewardDto, PointEarnRequestDto, RewardRedeemRequestDto, UpdateLoyaltyRuleDto, VerifyRedemptionDto } from './dto/loyalty.dto';

@ApiTags('Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  private getBusinessId(req: any): string {
    return req.user?.businessId || '123e4567-e89b-12d3-a456-426614174000';
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({
    status: 201,
    description: 'The campaign has been successfully created.',
    type: Campaign,
  })
  create(@Body() createCampaignDto: CreateCampaignDto, @Req() req: any) {
    return this.campaignsService.create(
      createCampaignDto,
      this.getBusinessId(req),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiQuery({ name: 'status', enum: CampaignStatus, required: false })
  @ApiResponse({
    status: 200,
    description: 'List of campaigns',
    type: [Campaign],
  })
  findAll(@Req() req: any, @Query('status') status?: CampaignStatus) {
    return this.campaignsService.findAll(this.getBusinessId(req), status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get campaign dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics cards' })
  getStats(@Req() req: any) {
    return this.campaignsService.getStats(this.getBusinessId(req));
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get scheduled campaigns' })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled campaigns',
    type: [Campaign],
  })
  getScheduled(@Req() req: any) {
    return this.campaignsService.findAll(
      this.getBusinessId(req),
      CampaignStatus.SCHEDULED,
    );
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get campaign templates' })
  @ApiResponse({
    status: 200,
    description: 'List of campaign templates',
    type: [CampaignTemplate],
  })
  getTemplates(@Req() req: any) {
    return this.campaignsService.getTemplates(this.getBusinessId(req));
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a campaign template' })
  @ApiResponse({
    status: 201,
    description: 'The template has been created.',
    type: CampaignTemplate,
  })
  createTemplate(
    @Body() createTemplateDto: CreateCampaignTemplateDto,
    @Req() req: any,
  ) {
    return this.campaignsService.createTemplate(
      createTemplateDto,
      this.getBusinessId(req),
    );
  }

  @Get(':id')
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
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign successfully deleted' })
  remove(@Param('id') id: string) {
    return this.campaignsService.remove(id);
  }

  // --- Loyalty Endpoints ---

  @Get('loyalty/profile/:userId')
  @ApiOperation({ summary: 'Get or create loyalty profile for user' })
  @ApiResponse({
    status: 200,
    description: 'The user loyalty profile',
    type: LoyaltyProfile,
  })
  getLoyaltyProfile(@Param('userId') userId: string, @Req() req: any) {
    return this.campaignsService.getLoyaltyProfile(userId, this.getBusinessId(req));
  }

  @Get('loyalty/profiles')
  @ApiOperation({ summary: 'Get all loyalty profiles for business (Customer Directory)' })
  @ApiResponse({
    status: 200,
    description: 'List of all loyalty profiles',
    type: [LoyaltyProfile],
  })
  getLoyaltyProfiles(@Req() req: any) {
    return this.campaignsService.getLoyaltyProfiles(this.getBusinessId(req));
  }

  @Get('loyalty/rules')
  @ApiOperation({ summary: 'Get business loyalty rules' })
  @ApiResponse({
    status: 200,
    description: 'The loyalty rules',
    type: LoyaltyRule,
  })
  getLoyaltyRule(@Req() req: any) {
    return this.campaignsService.getLoyaltyRule(this.getBusinessId(req));
  }

  @Patch('loyalty/rules')
  @ApiOperation({ summary: 'Update business loyalty rules' })
  @ApiBody({ type: UpdateLoyaltyRuleDto })
  @ApiResponse({
    status: 200,
    description: 'Updated loyalty rules',
    type: LoyaltyRule,
  })
  updateLoyaltyRule(@Body() updates: UpdateLoyaltyRuleDto, @Req() req: any) {
    return this.campaignsService.updateLoyaltyRule(this.getBusinessId(req), updates);
  }

  @Get('loyalty/rewards')
  @ApiOperation({ summary: 'Get all active rewards' })
  @ApiResponse({
    status: 200,
    description: 'List of rewards',
    type: [Reward],
  })
  getRewards(@Req() req: any) {
    return this.campaignsService.getRewards(this.getBusinessId(req));
  }

  @Post('loyalty/rewards')
  @ApiOperation({ summary: 'Create a new reward' })
  @ApiBody({ type: CreateRewardDto })
  @ApiResponse({
    status: 201,
    description: 'The created reward',
    type: Reward,
  })
  createReward(@Body() dto: CreateRewardDto, @Req() req: any) {
    return this.campaignsService.createReward(this.getBusinessId(req), dto);
  }

  @Patch('loyalty/rewards/:id')
  @ApiOperation({ summary: 'Update a reward' })
  @ApiBody({ type: UpdateRewardDto })
  @ApiResponse({
    status: 200,
    description: 'The updated reward',
    type: Reward,
  })
  updateReward(@Param('id') id: string, @Body() dto: UpdateRewardDto, @Req() req: any) {
    return this.campaignsService.updateReward(this.getBusinessId(req), id, dto);
  }

  @Post('loyalty/earn')
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
        breakdown: { visitPoints: 50, spendingPoints: 100 }
      }
    }
  })
  earnPoints(@Body() dto: PointEarnRequestDto, @Req() req: any) {
    return this.campaignsService.earnPoints(this.getBusinessId(req), dto);
  }

  @Post('loyalty/redeem')
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
          status: 'pending'
        }
      }
    }
  })
  redeemReward(@Body() dto: RewardRedeemRequestDto, @Req() req: any) {
    return this.campaignsService.redeemReward(this.getBusinessId(req), dto);
  }

  @Post('loyalty/verify-redemption')
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
          verifiedAt: '2024-03-10T15:00:00Z'
        }
      }
    }
  })
  verifyRedemption(@Body() dto: VerifyRedemptionDto, @Req() req: any) {
    return this.campaignsService.verifyRedemption(this.getBusinessId(req), dto.code);
  }

  @Get('loyalty/transactions/:profileId')
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
