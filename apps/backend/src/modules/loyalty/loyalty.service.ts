import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere } from 'typeorm';
import {
  LoyaltyProfile,
  TierLevel,
} from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { DevicesService } from '../devices/devices.service';
import {
  EarnPointsDto,
  RedeemRewardDto,
  CreateLoyaltyRewardDto,
  UpdateLoyaltyRuleDto,
  GenerateRedemptionCodeDto,
  CreateLoyaltyTemplateDto,
  UpdateLoyaltyTemplateDto,
} from '../campaigns/dto/loyalty.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { BranchesService } from '../branches/branches.service';
import { LoyaltyRule } from '../campaigns/entities/loyalty-rule.entity';
import { LoyaltyTemplate } from '../campaigns/entities/loyalty-template.entity';

export interface CustomerAnalyticsResponse {
  totalVisits: number;
  currentPointsBalance: number;
  netSavings: number;
  visitTrends: { month: string; visits: number }[];
  pointsByVenue: { venueName: string; points: number }[];
  topVenues: { venueName: string; points: number; visits: number }[];
}

export interface BusinessLoyaltyStatsResponse {
  stats: { label: string; value: string; change: number; trend: 'up' | 'down' }[];
  tierDistribution: { label: string; value: number; color: string }[];
  activityTrend: { name: string; earnings: number; claims: number }[];
  growthForecast: string;
}

export interface TapResponse {
  success: boolean;
  pointsEarned: number;
  newBalance?: number;
  message: string;
}

export interface DeviceInfoResponse {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  branch: any; // Branch entity has complex circular refs, usually okay to leave or use Partial
  business: any;
  businessId: string;
  userProfile: LoyaltyProfile | null;
  isFirstTimeVisit: boolean;
}

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyProfile)
    private loyaltyProfileRepository: Repository<LoyaltyProfile>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(PointTransaction)
    private transactionRepository: Repository<PointTransaction>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
    @InjectRepository(Visit)
    private visitRepository: Repository<Visit>,
    private readonly devicesService: DevicesService,
    private readonly campaignsService: CampaignsService,
    private readonly branchesService: BranchesService,
    private readonly dataSource: DataSource,
  ) {}

  async checkBranchAccess(user: User, branchId: string): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  // --- Rules ---

  async getLoyaltyRule(branchId?: string, businessId?: string): Promise<LoyaltyRule> {
    return this.campaignsService.getLoyaltyRule(branchId, businessId);
  }

  async updateLoyaltyRule(branchId: string, updates: UpdateLoyaltyRuleDto): Promise<LoyaltyRule> {
    return this.campaignsService.updateLoyaltyRule(branchId, updates);
  }

  // --- Profile Management ---

  async getProfile(
    userId: string,
    branchId?: string,
    businessId?: string,
  ): Promise<LoyaltyProfile> {
    const where: FindOptionsWhere<LoyaltyProfile> = { userId };
    if (branchId) {
      where.branchId = branchId;
    } else if (businessId) {
      const profiles = await this.loyaltyProfileRepository.find({
        where: { userId, businessId },
        order: { totalPointsEarned: 'DESC' },
      });
      if (profiles.length > 0) return profiles[0];
    }

    let profile = await this.loyaltyProfileRepository.findOne({ where });

    if (!profile && branchId) {
      const branch = await this.branchesService.findById(branchId);
      profile = this.loyaltyProfileRepository.create({
        userId,
        branchId,
        businessId: branch.businessId,
        points: 0,
        tierLevel: TierLevel.BRONZE,
        currentPointsBalance: 0,
        totalPointsEarned: 0,
        pointsRedeemed: 0,
      } as Partial<LoyaltyProfile>) as unknown as LoyaltyProfile;
      await this.loyaltyProfileRepository.save(profile);
    }

    if (!profile) {
      throw new NotFoundException('Loyalty profile not found');
    }

    return profile;
  }

  async createCustomerProfile(
    userId: string,
    branchId: string,
  ): Promise<LoyaltyProfile> {
    return this.getProfile(userId, branchId);
  }

  async getAllProfiles(userId: string): Promise<LoyaltyProfile[]> {
    return this.loyaltyProfileRepository.find({
      where: { userId },
      relations: ['branch'],
    });
  }

  // --- Rewards ---

  async getRewards(branchId?: string, businessId?: string): Promise<Reward[]> {
    if (branchId) {
      return this.rewardRepository.find({
        where: { branchId, isActive: true },
      });
    }
    if (businessId) {
      return this.rewardRepository.find({
        where: { businessId, isActive: true },
      });
    }
    return [];
  }

  async createReward(
    branchId: string,
    dto: CreateLoyaltyRewardDto,
  ): Promise<Reward> {
    const branch = await this.branchesService.findById(branchId);
    const reward = this.rewardRepository.create({
      ...dto,
      branchId,
      businessId: branch.businessId,
      totalRedeemed: 0,
      isActive: true,
    } as Partial<Reward>) as unknown as Reward;
    return this.rewardRepository.save(reward);
  }

  async redeemReward(
    userId: string,
    branchId: string,
    rewardId: string,
  ): Promise<Redemption> {
    const profile = await this.getProfile(userId, branchId);
    const reward = await this.rewardRepository.findOne({
      where: { id: rewardId, branchId },
    });

    if (!reward) throw new NotFoundException('Reward not found');

    const pointCost = reward.pointCost;

    if (profile.currentPointsBalance < pointCost) {
      throw new BadRequestException('Insufficient points');
    }

    return await this.dataSource.transaction(async (manager) => {
      profile.currentPointsBalance -= pointCost;
      profile.points = profile.currentPointsBalance;
      profile.pointsRedeemed += pointCost;
      await manager.save(profile);

      const redemptionCode = Math.floor(100000000 + Math.random() * 900000000).toString();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (reward.validityDays || 30));

      const redemption = this.redemptionRepository.create({
        loyaltyProfile: profile,
        reward,
        rewardId: reward.id,
        loyaltyProfileId: profile.id,
        branchId,
        businessId: profile.businessId,
        pointsSpent: pointCost,
        status: 'pending',
        redemptionCode,
        expiresAt,
      } as Partial<Redemption>) as unknown as Redemption;

      const savedRedemption = await manager.save(redemption);

      // Record transaction
      const transaction = this.transactionRepository.create({
        loyaltyProfile: profile,
        businessId: profile.businessId,
        transactionType: 'redeem',
        pointsAmount: -pointCost,
        points: -pointCost,
        reason: `Redeemed Reward: ${reward.name}`,
        referenceId: savedRedemption.id,
      } as Partial<PointTransaction>) as unknown as PointTransaction;
      await manager.save(transaction);

      return savedRedemption;
    });
  }

  async getRewardRedemptions(rewardId: string, branchId: string): Promise<Redemption[]> {
    return this.redemptionRepository.find({
      where: { rewardId, branchId },
      relations: ['loyaltyProfile', 'loyaltyProfile.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // --- Transactions ---

  async earnPoints(branchId: string, dto: EarnPointsDto): Promise<{ success: boolean; pointsEarned: number; newBalance: number; message: string }> {
    return this.campaignsService.earnPoints(branchId, dto);
  }

  async getHistory(
    userId: string,
    branchId?: string,
    businessId?: string,
  ): Promise<any[]> {
    const profileWhere: FindOptionsWhere<LoyaltyProfile> = { userId };
    if (branchId) profileWhere.branchId = branchId;
    else if (businessId) profileWhere.businessId = businessId;

    const transactions = await this.transactionRepository.find({
      where: { loyaltyProfile: profileWhere },
      relations: ['loyaltyProfile', 'loyaltyProfile.branch'],
      order: { createdAt: 'DESC' },
    });

    const redemptions = await this.redemptionRepository.find({
      where: { loyaltyProfile: profileWhere },
      relations: ['loyaltyProfile', 'loyaltyProfile.branch', 'reward'],
      order: { createdAt: 'DESC' },
    });

    // Merge and sort
    return [...transactions, ...redemptions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // --- Templates ---

  async getLoyaltyTemplates(): Promise<LoyaltyTemplate[]> {
    return this.campaignsService.getLoyaltyTemplates();
  }

  async createLoyaltyTemplate(data: CreateLoyaltyTemplateDto): Promise<LoyaltyTemplate> {
    return this.campaignsService.createLoyaltyTemplate(data);
  }

  async updateLoyaltyTemplate(id: string, updates: UpdateLoyaltyTemplateDto): Promise<LoyaltyTemplate> {
    return this.campaignsService.updateLoyaltyTemplate(id, updates);
  }

  async deleteLoyaltyTemplate(id: string): Promise<void> {
    return this.campaignsService.deleteLoyaltyTemplate(id);
  }

  async applyLoyaltyTemplate(branchId: string, templateId: string): Promise<{ success: boolean; message: string }> {
    return this.campaignsService.applyLoyaltyTemplate(branchId, templateId);
  }

  // --- Code Flow ---

  async generateRedemptionCode(branchId: string, dto: GenerateRedemptionCodeDto, staffId: string): Promise<Redemption> {
    return this.campaignsService.generateRedemptionCode(branchId, dto, staffId);
  }

  async claimRedemptionCode(userId: string, branchId: string, code: string): Promise<{ success: boolean; redemption: Redemption }> {
    return this.campaignsService.claimRedemptionCode(userId, branchId, code);
  }

  // --- Taps ---

  async processTap(userId: string, code: string): Promise<{ success: boolean; pointsEarned: number; newBalance?: number; message: string }> {
    const device = await this.devicesService.findByCode(code);
    if (!device) throw new NotFoundException('Device not found');

    if (!userId) {
      return {
        success: true,
        message: 'Guest visit acknowledged',
        pointsEarned: 0,
      };
    }

    return this.earnPoints(device.branchId, { userId, isVisit: true });
  }

  async getDeviceByCode(code: string, userId?: string): Promise<{
    id: string;
    name: string;
    code: string;
    branchId: string;
    branchName: string;
    branch: any;
    business: any;
    businessId: string;
    userProfile: LoyaltyProfile | null;
    isFirstTimeVisit: boolean;
  }> {
    const device = await this.devicesService.findByCode(code);
    if (!device) throw new NotFoundException('Device not found');

    const branch = await this.branchesService.findById(device.branchId, [
      'business',
    ]);

    let profile: LoyaltyProfile | null = null;
    if (userId) {
      try {
        profile = await this.getProfile(userId, device.branchId);
      } catch (e) {
        // ignore
      }
    }

    const isFirstTimeVisit = userId
      ? !(await this.checkVisit(userId, device.branchId))
      : true;

    return {
      id: device.id,
      name: device.name,
      code: device.code,
      branchId: branch.id,
      branchName: branch.name,
      branch,
      business: branch.business,
      businessId: branch.businessId,
      userProfile: profile,
      isFirstTimeVisit,
    };
  }

  // --- Stats ---

  async getAnalytics(userId: string): Promise<CustomerAnalyticsResponse> {
    const profiles = await this.getAllProfiles(userId);
    const totalPoints = profiles.reduce(
      (sum, p) => sum + (p.currentPointsBalance || 0),
      0,
    );
    const visits = await this.visitRepository.find({
      where: { customer: { id: userId } },
      relations: ['branch'],
    });

    const visitTrends: { month: string; visits: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = months[d.getMonth()];
      const count = visits.filter(v => 
        v.createdAt.getMonth() === d.getMonth() && 
        v.createdAt.getFullYear() === d.getFullYear()
      ).length;
      visitTrends.push({ month: monthLabel, visits: count });
    }

    const pointsByVenue = profiles.map(p => ({
      venueName: p.branch?.name || 'Unknown',
      points: p.currentPointsBalance || 0,
    })).sort((a, b) => b.points - a.points);

    const venueVisitMap = new Map<string, number>();
    visits.forEach(v => {
      const name = v.branch?.name || 'Unknown';
      venueVisitMap.set(name, (venueVisitMap.get(name) || 0) + 1);
    });

    const topVenues = Array.from(venueVisitMap.entries()).map(([name, count]) => {
      const profile = profiles.find(p => p.branch?.name === name);
      return {
        venueName: name,
        points: profile?.currentPointsBalance || 0,
        visits: count
      };
    }).sort((a, b) => b.visits - a.visits).slice(0, 5);

    return {
      totalVisits: visits.length,
      currentPointsBalance: totalPoints,
      netSavings: totalPoints * 0.5, 
      visitTrends,
      pointsByVenue,
      topVenues,
    };
  }

  async getBusinessLoyaltyStats(
    branchId?: string,
    businessId?: string,
  ): Promise<BusinessLoyaltyStatsResponse> {
    const profileWhere: FindOptionsWhere<LoyaltyProfile> = {};
    if (branchId) profileWhere.branchId = branchId;
    else if (businessId) profileWhere.businessId = businessId;

    const profiles = await this.loyaltyProfileRepository.find({ where: profileWhere });
    const totalMembers = profiles.length;

    const transactions = await this.transactionRepository.find({
      where: { businessId: businessId || undefined, branchId: branchId || undefined },
    });
    const totalPointsIssued = transactions.reduce(
      (sum, t) => sum + (t.pointsAmount > 0 ? t.pointsAmount : 0),
      0,
    );

    const redemptions = await this.redemptionRepository.find({
      where: { businessId: businessId || undefined, branchId: branchId || undefined },
    });
    const totalRedemptions = redemptions.length;

    let bronze = 0, silver = 0, gold = 0, platinum = 0;
    profiles.forEach(p => {
      if (p.tierLevel === TierLevel.PLATINUM) platinum++;
      else if (p.tierLevel === TierLevel.GOLD) gold++;
      else if (p.tierLevel === TierLevel.SILVER) silver++;
      else bronze++;
    });

    const tierDistribution = [
      { label: 'Bronze', value: totalMembers ? Math.round((bronze / totalMembers) * 100) : 0, color: 'bg-orange-600' },
      { label: 'Silver', value: totalMembers ? Math.round((silver / totalMembers) * 100) : 0, color: 'bg-slate-400' },
      { label: 'Gold', value: totalMembers ? Math.round((gold / totalMembers) * 100) : 0, color: 'bg-yellow-500' },
      { label: 'Platinum', value: totalMembers ? Math.round((platinum / totalMembers) * 100) : 0, color: 'bg-indigo-600' },
    ];

    const activityTrend: { name: string; earnings: number; claims: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0,0,0,0));
      const dayEnd = new Date(d.setHours(23,59,59,999));
      
      const dayEarnings = transactions.filter(t => t.transactionType === 'earn' && new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd).length;
      const dayClaims = transactions.filter(t => t.transactionType === 'redeem' && new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd).length;
      
      activityTrend.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        earnings: dayEarnings,
        claims: dayClaims,
      });
    }

    return {
      stats: [
        { label: 'Total Members', value: totalMembers.toLocaleString(), change: 12, trend: 'up' },
        { label: 'Points Earned', value: totalPointsIssued.toLocaleString(), change: 8, trend: 'up' },
        { label: 'Rewards Claimed', value: totalRedemptions.toLocaleString(), change: 5, trend: 'up' },
        { label: 'Redemption Rate', value: totalMembers > 0 ? ((totalRedemptions / totalMembers) * 100).toFixed(1) + '%' : '0%', change: 2, trend: 'up' },
      ],
      tierDistribution,
      activityTrend,
      growthForecast: '+15%',
    };
  }

  async checkVisit(userId: string, branchId: string): Promise<boolean> {
    const count = await this.visitRepository.count({
      where: { customer: { id: userId }, branchId },
    });
    return count > 0;
  }
}
