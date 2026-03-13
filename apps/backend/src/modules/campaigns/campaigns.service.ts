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
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';
import { AutomationService } from '../messaging/services/automation.service';
import { TriggerType } from '../messaging/enums/automation.enum';
import {
  CreateRewardDto,
  UpdateRewardDto,
  PointEarnRequestDto,
  RewardRedeemRequestDto,
  UpdateLoyaltyRuleDto,
} from './dto/loyalty.dto';

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
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    private branchesService: BranchesService,
    private automationService: AutomationService,
  ) {}

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  async create(
    createCampaignDto: CreateCampaignDto,
    branchId: string,
  ): Promise<Campaign> {
    const branch = await this.branchesService.findById(branchId);
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      branchId,
      businessId: branch.businessId,
    } as any) as unknown as Campaign;

    (campaign as any).sent = 0;
    (campaign as any).delivered = '0%';
    (campaign as any).clicks = 0;

    return this.campaignRepository.save(campaign);
  }

  async findAll(
    branchId: string,
    status?: CampaignStatus,
  ): Promise<Campaign[]> {
    const where: any = { branchId };
    if (status) {
      where.status = status;
    }

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
    const campaigns = await this.findAll(branchId);

    const totalSent = campaigns.reduce(
      (acc, c) => acc + (c as any).sent || 0,
      0,
    );
    const totalClicks = campaigns.reduce(
      (acc, c) => acc + (c as any).clicks || 0,
      0,
    );
    const activeCount = campaigns.filter(
      (c) => (c as any).status === CampaignStatus.ACTIVE,
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
        value: '94%',
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
    let businessId: string | null = null;
    if (branchId) {
      const branch = await this.branchesService.findById(branchId);
      businessId = branch.businessId;
    }

    const template = this.templateRepository.create({
      ...dto,
      branchId: branchId ?? null,
      businessId,
    } as any) as unknown as CampaignTemplate;

    return this.templateRepository.save(template);
  }

  async getTemplates(branchId?: string | null): Promise<CampaignTemplate[]> {
    return this.templateRepository.find({
      where: [{ branchId: IsNull() }, ...(branchId ? [{ branchId }] : [])],
      order: { createdAt: 'ASC' },
    });
  }

  // Loyalty Features
  async getLoyaltyProfile(
    userId: string,
    branchId: string,
  ): Promise<LoyaltyProfile> {
    let profile = await this.profileRepository.findOne({
      where: { userId, branchId },
    });

    if (!profile) {
      const branch = await this.branchesService.findById(branchId);
      profile = this.profileRepository.create({
        userId,
        branchId,
        businessId: branch.businessId,
        tierLevel: 'bronze',
        points: 0,
        currentPointsBalance: 0,
      } as any) as unknown as LoyaltyProfile;
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
      const branch = await this.branchesService.findById(branchId);
      rule = this.ruleRepository.create({
        branchId,
        businessId: branch.businessId,
      } as any) as unknown as LoyaltyRule;
      await this.ruleRepository.save(rule);
    }
    return rule;
  }

  async findActiveRule(branchId: string): Promise<LoyaltyRule | null> {
    return this.ruleRepository.findOne({
      where: { branchId, isActive: true },
    });
  }

  async findProfile(
    userId: string,
    branchId: string,
  ): Promise<LoyaltyProfile | null> {
    return this.profileRepository.findOne({
      where: { userId, branchId },
    });
  }

  async updateLoyaltyRule(
    branchId: string,
    updates: UpdateLoyaltyRuleDto,
  ): Promise<LoyaltyRule> {
    const rule = await this.getLoyaltyRule(branchId);
    Object.assign(rule, updates);
    return this.ruleRepository.save(rule);
  }

  async createReward(branchId: string, dto: CreateRewardDto): Promise<Reward> {
    const branch = await this.branchesService.findById(branchId);
    const reward = this.rewardRepository.create({
      ...dto,
      branchId,
      businessId: branch.businessId,
    } as any) as unknown as Reward;
    return this.rewardRepository.save(reward);
  }

  async updateReward(
    branchId: string,
    id: string,
    dto: UpdateRewardDto,
  ): Promise<Reward> {
    const reward = await this.rewardRepository.findOne({
      where: { id, branchId },
    });
    if (!reward) throw new NotFoundException('Reward not found');
    Object.assign(reward, dto);
    return this.rewardRepository.save(reward);
  }

  async getRewards(branchId?: string, businessId?: string): Promise<Reward[]> {
    if (branchId) {
      return this.rewardRepository.find({ where: { branchId, isActive: true } });
    }
    if (businessId) {
      return this.rewardRepository.find({
        where: { businessId, isActive: true },
      });
    }
    return [];
  }

  async earnPoints(branchId: string, dto: PointEarnRequestDto): Promise<any> {
    const branch = await this.branchesService.findById(branchId);
    if (!branch) throw new NotFoundException('Branch not found');

    // We need to fetch the business to get the ownerId
    const business = await (this as any).ruleRepository.manager
      .getRepository(Business)
      .findOne({
        where: { id: branch.businessId },
      });

    if (business && business.ownerId === dto.userId) {
      return {
        success: false,
        pointsEarned: 0,
        message: 'Owners cannot earn points at their own business.',
      };
    }

    const rule = await this.getLoyaltyRule(branchId);
    if (!rule || !rule.isActive) {
      return {
        success: false,
        pointsEarned: 0,
        newBalance: 0,
        message: 'Loyalty system is inactive',
      };
    }

    const profile = await this.getLoyaltyProfile(dto.userId, branchId);

    let earned = 0;
    const breakdown: Record<string, number> = {};

    if (dto.isVisit) {
      if (profile.lastRewardedAt && rule.visitCooldownHours) {
        const lastRewarded = new Date(profile.lastRewardedAt).getTime();
        const cooldownMs = rule.visitCooldownHours * 60 * 60 * 1000;
        if (Date.now() - lastRewarded < cooldownMs) {
          return {
            success: false,
            pointsEarned: 0,
            newBalance: profile.currentPointsBalance,
            message: `Visit reward is on cooldown. Please wait ${rule.visitCooldownHours} hours between rewards.`,
          };
        }
      }
      earned += rule.visitPoints || 0;
      breakdown.visitPoints = rule.visitPoints;
    }

    if (dto.amountSpent && rule.spendingBaseAmount && rule.spendingBasePoints) {
      const spendPoints = Math.floor(
        (dto.amountSpent / rule.spendingBaseAmount) * rule.spendingBasePoints,
      );
      earned += spendPoints;
      breakdown.spendingPoints = spendPoints;
    }

    if (profile.totalPointsEarned === 0 && rule.firstVisitBonus) {
      earned += rule.firstVisitBonus;
      breakdown.bonusPoints = rule.firstVisitBonus;
    }

    if (earned <= 0) {
      return {
        success: true,
        pointsEarned: 0,
        newBalance: profile.currentPointsBalance,
        message: 'No points earned for this action',
      };
    }

    profile.totalPointsEarned += earned;
    profile.currentPointsBalance += earned;
    (profile as any).points = profile.currentPointsBalance; // Set both
    profile.lastVisitDate = new Date();
    profile.lastRewardedAt = new Date();

    let milestoneReached = false;
    if (profile.totalPointsEarned >= 5000 && profile.tierLevel !== 'platinum') {
      profile.tierLevel = 'platinum';
      milestoneReached = true;
    } else if (
      profile.totalPointsEarned >= 2000 &&
      profile.tierLevel !== 'gold' &&
      profile.tierLevel !== 'platinum'
    ) {
      profile.tierLevel = 'gold';
      milestoneReached = true;
    } else if (
      profile.totalPointsEarned >= 500 &&
      profile.tierLevel !== 'silver' &&
      profile.tierLevel !== 'gold' &&
      profile.tierLevel !== 'platinum'
    ) {
      profile.tierLevel = 'silver';
      milestoneReached = true;
    }

    await this.profileRepository.save(profile);

    if (milestoneReached) {
      const user = await this.userRepo.findOne({ where: { id: dto.userId } });
      if (user) {
        let contact = await this.contactRepo.findOne({
          where: [
            { branchId, email: user.email },
            { branchId, phone: user.phone },
          ],
        });
        if (!contact) {
          const newContact = this.contactRepo.create({
            branchId,
            businessId: profile.businessId,
            email: user.email,
            phone: user.phone,
            name: `${user.firstName} ${user.lastName}`,
          } as any) as unknown as Contact;
          contact = await this.contactRepo.save(newContact);
        }

        if (contact) {
          await this.automationService.trigger(TriggerType.REWARD_EARNED, {
            branchId,
            contactId: contact.id,
          });
        }
      }
    }

    const transaction = this.transactionRepository.create({
      loyaltyProfile: profile,
      businessId: profile.businessId,
      transactionType: 'earn',
      pointsAmount: earned,
      points: earned,
      reason:
        dto.isVisit && dto.amountSpent
          ? 'Visit + Purchase'
          : dto.isVisit
            ? 'Visit'
            : 'Purchase',
      metadata: breakdown,
    } as any) as unknown as PointTransaction;
    await this.transactionRepository.save(transaction);

    return {
      success: true,
      pointsEarned: earned,
      newBalance: profile.currentPointsBalance,
      message: `Congratulations! You earned ${earned} points.`,
      breakdown,
    };
  }

  async redeemReward(
    branchId: string,
    dto: RewardRedeemRequestDto,
  ): Promise<any> {
    const profile = await this.profileRepository.findOne({
      where: { id: dto.loyaltyProfileId, branchId },
    });
    const reward = await this.rewardRepository.findOne({
      where: { id: dto.rewardId, branchId },
    });

    if (!profile || !reward)
      return { success: false, error: 'Profile or Reward not found' };

    const pointCost =
      (reward as any).pointCost || (reward as any).pointsRequired;

    if (profile.currentPointsBalance < pointCost)
      return { success: false, error: 'Insufficient points' };

    profile.currentPointsBalance -= pointCost;
    (profile as any).points = profile.currentPointsBalance;
    profile.pointsRedeemed += pointCost;
    await this.profileRepository.save(profile);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + reward.validityDays);

    const redemption = this.redemptionRepository.create({
      loyaltyProfile: profile,
      reward: reward,
      branchId,
      businessId: profile.businessId,
      redemptionCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      pointsSpent: pointCost,
      status: 'pending',
      expiresAt,
    } as any) as unknown as Redemption;
    await this.redemptionRepository.save(redemption);

    reward.totalRedeemed += 1;
    await this.rewardRepository.save(reward);

    const transaction = this.transactionRepository.create({
      loyaltyProfile: profile,
      businessId: profile.businessId,
      transactionType: 'redeem',
      pointsAmount: -pointCost,
      points: -pointCost,
      reason: `Redeemed ${reward.name}`,
      referenceId: redemption.id,
    } as any) as unknown as PointTransaction;
    await this.transactionRepository.save(transaction);

    return { success: true, redemption };
  }

  async verifyRedemption(branchId: string, code: string): Promise<any> {
    const redemption = await this.redemptionRepository.findOne({
      where: { redemptionCode: code, status: 'pending' },
      relations: ['reward'],
    });

    if (!redemption)
      return { success: false, error: 'Invalid or already used code' };
    if (redemption.reward.branchId !== branchId)
      return { success: false, error: 'Reward not found for this branch' };

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
      order: { createdAt: 'DESC' },
    });
  }
}
