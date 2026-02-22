import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { LoyaltyProfile } from './entities/loyalty-profile.entity';
import { PointTransaction } from './entities/point-transaction.entity';
import { LoyaltyRule } from './entities/loyalty-rule.entity';
import { Reward } from './entities/reward.entity';
import { Redemption } from './entities/redemption.entity';
import { CreateRewardDto, UpdateRewardDto, PointEarnRequestDto, RewardRedeemRequestDto, UpdateLoyaltyRuleDto } from './dto/loyalty.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignTemplate)
    private templateRepository: Repository<CampaignTemplate>,
    @InjectRepository(LoyaltyProfile)
    private profileRepository: Repository<LoyaltyProfile>,
    @InjectRepository(PointTransaction)
    private transactionRepository: Repository<PointTransaction>,
    @InjectRepository(LoyaltyRule)
    private ruleRepository: Repository<LoyaltyRule>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
  ) { }

  async create(
    createCampaignDto: CreateCampaignDto,
    branchId: string,
  ): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      branchId,
    });
    // Mock initial stats
    campaign.sent = 0;
    campaign.delivered = '0%';
    campaign.clicks = 0;

    return this.campaignRepository.save(campaign);
  }

  async findAll(
    branchId: string,
    status?: CampaignStatus,
  ): Promise<Campaign[]> {
    const where: any = { branchId };
    if (status) where.status = status;

    return this.campaignRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepository.softDelete(campaign.id);
  }

  async getStats(branchId: string) {
    // In a real app, we would aggregate this from the DB or a separate analytics table.
    // For now, we mock the trends but calculate the totals from actual campaigns if possible,
    // or just return the mocked structure required by the frontend.

    const campaigns = await this.findAll(branchId);

    const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
    const activeCount = campaigns.filter(
      (c) => c.status === CampaignStatus.ACTIVE,
    ).length;

    return [
      {
        label: 'Total Sent',
        value: totalSent.toLocaleString(),
        icon: 'send',
        color: 'blue',
        trend: { value: '+15%', isUp: true },
      },
      {
        label: 'Avg. Delivery',
        value: '94%', // Mocked for now
        icon: 'visibility',
        color: 'green',
        trend: { value: '+2%', isUp: true },
      },
      {
        label: 'Total Clicks',
        value: totalClicks.toLocaleString(),
        icon: 'touch_app',
        color: 'purple',
        trend: { value: '+1.5%', isUp: true },
      },
      {
        label: 'Active Campaigns',
        value: activeCount.toString(),
        icon: 'campaign',
        color: 'yellow',
        trend: { value: '0', isUp: true },
      },
    ];
  }

  // Templates
  async createTemplate(
    dto: CreateCampaignTemplateDto,
    branchId?: string | null,
  ): Promise<CampaignTemplate> {
    const template = this.templateRepository.create({
      ...dto,
      branchId: branchId ?? null,
    });
    return this.templateRepository.save(template);
  }

  async getTemplates(branchId?: string | null): Promise<CampaignTemplate[]> {
    // Return both global (null branchId) and specific branch templates
    return this.templateRepository.find({
      where: [
        { branchId: IsNull() }, // Global
        ...(branchId ? [{ branchId }] : []),
      ],
      order: { createdAt: 'ASC' },
    });
  }

  // Loyalty Features
  async getLoyaltyProfile(userId: string, branchId: string): Promise<LoyaltyProfile> {
    let profile = await this.profileRepository.findOne({ where: { userId, branchId } });
    if (!profile) {
      profile = this.profileRepository.create({ userId, branchId, tierLevel: 'bronze' });
      await this.profileRepository.save(profile);
    }
    return profile;
  }

  async getLoyaltyProfiles(branchId: string): Promise<LoyaltyProfile[]> {
    return this.profileRepository.find({ where: { branchId } });
  }

  async getLoyaltyRule(branchId: string): Promise<LoyaltyRule> {
    let rule = await this.ruleRepository.findOne({ where: { branchId } });
    if (!rule) {
      rule = this.ruleRepository.create({ branchId });
      await this.ruleRepository.save(rule);
    }
    return rule;
  }

  async updateLoyaltyRule(branchId: string, updates: UpdateLoyaltyRuleDto): Promise<LoyaltyRule> {
    const rule = await this.getLoyaltyRule(branchId);
    Object.assign(rule, updates);
    return this.ruleRepository.save(rule);
  }

  async createReward(branchId: string, dto: CreateRewardDto): Promise<Reward> {
    const reward = this.rewardRepository.create({ ...dto, branchId });
    return this.rewardRepository.save(reward);
  }

  async updateReward(branchId: string, id: string, dto: UpdateRewardDto): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({ where: { id, branchId } });
    if (!reward) throw new NotFoundException('Reward not found');
    Object.assign(reward, dto);
    return this.rewardRepository.save(reward);
  }

  async getRewards(branchId: string): Promise<Reward[]> {
    return this.rewardRepository.find({ where: { branchId, isActive: true } });
  }

  async earnPoints(branchId: string, dto: PointEarnRequestDto): Promise<any> {
    const rule = await this.getLoyaltyRule(branchId);
    if (!rule || !rule.isActive) {
      return { success: false, pointsEarned: 0, newBalance: 0, message: 'Loyalty system is inactive' };
    }

    const profile = await this.getLoyaltyProfile(dto.userId, branchId);

    let earned = 0;
    const breakdown: any = {};

    if (dto.isVisit) {
      earned += rule.visitPoints || 0;
      breakdown.visitPoints = rule.visitPoints;
    }

    if (dto.amountSpent && rule.spendingBaseAmount && rule.spendingBasePoints) {
      const spendPoints = Math.floor((dto.amountSpent / rule.spendingBaseAmount) * rule.spendingBasePoints);
      earned += spendPoints;
      breakdown.spendingPoints = spendPoints;
    }

    if (profile.totalPointsEarned === 0 && rule.firstVisitBonus) {
      earned += rule.firstVisitBonus;
      breakdown.bonusPoints = rule.firstVisitBonus;
    }

    if (earned <= 0) {
      return { success: true, pointsEarned: 0, newBalance: profile.currentPointsBalance, message: 'No points earned for this action' };
    }

    profile.totalPointsEarned += earned;
    profile.currentPointsBalance += earned;
    profile.lastVisitDate = new Date();
    profile.lastRewardedAt = new Date();

    if (profile.totalPointsEarned >= 5000) profile.tierLevel = 'platinum';
    else if (profile.totalPointsEarned >= 2000) profile.tierLevel = 'gold';
    else if (profile.totalPointsEarned >= 500) profile.tierLevel = 'silver';

    await this.profileRepository.save(profile);

    const transaction = this.transactionRepository.create({
      loyaltyProfileId: profile.id,
      transactionType: 'earn',
      pointsAmount: earned,
      reason: dto.isVisit && dto.amountSpent ? 'Visit + Purchase' : dto.isVisit ? 'Visit' : 'Purchase',
      metadata: breakdown,
    });
    await this.transactionRepository.save(transaction);

    return {
      success: true,
      pointsEarned: earned,
      newBalance: profile.currentPointsBalance,
      message: `Congratulations! You earned ${earned} points.`,
      breakdown
    };
  }

  async redeemReward(branchId: string, dto: RewardRedeemRequestDto): Promise<any> {
    const profile = await this.profileRepository.findOne({ where: { id: dto.loyaltyProfileId, branchId } });
    const reward = await this.rewardRepository.findOne({ where: { id: dto.rewardId, branchId } });

    if (!profile || !reward) return { success: false, error: 'Profile or Reward not found' };
    if (profile.currentPointsBalance < reward.pointCost) return { success: false, error: 'Insufficient points' };

    profile.currentPointsBalance -= reward.pointCost;
    profile.pointsRedeemed += reward.pointCost;
    await this.profileRepository.save(profile);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.validityDays);

    const redemption = this.redemptionRepository.create({
      loyaltyProfileId: profile.id,
      rewardId: reward.id,
      redemptionCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      pointsSpent: reward.pointCost,
      status: 'pending',
      expiresAt
    });
    await this.redemptionRepository.save(redemption);

    reward.totalRedeemed += 1;
    await this.rewardRepository.save(reward);

    const transaction = this.transactionRepository.create({
      loyaltyProfileId: profile.id,
      transactionType: 'redeem',
      pointsAmount: -reward.pointCost,
      reason: `Redeemed ${reward.name}`,
      referenceId: redemption.id,
    });
    await this.transactionRepository.save(transaction);

    return { success: true, redemption };
  }

  async verifyRedemption(branchId: string, code: string): Promise<any> {
    const redemption = await this.redemptionRepository.findOne({
      where: { redemptionCode: code, status: 'pending' },
      relations: ['reward']
    });

    if (!redemption) return { success: false, error: 'Invalid or already used code' };
    if (redemption.reward.branchId !== branchId) return { success: false, error: 'Reward not found for this branch' };

    if (new Date(redemption.expiresAt) < new Date()) {
      redemption.status = 'expired';
      await this.redemptionRepository.save(redemption);
      return { success: false, error: 'Reward has expired' };
    }

    redemption.status = 'verified';
    redemption.verifiedAt = new Date();
    await this.redemptionRepository.save(redemption);

    return { success: true, redemption };
  }

  async getTransactions(profileId: string): Promise<PointTransaction[]> {
    return this.transactionRepository.find({
      where: { loyaltyProfileId: profileId },
      order: { createdAt: 'DESC' }
    });
  }

}
