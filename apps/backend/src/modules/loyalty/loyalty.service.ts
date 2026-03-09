import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
} from '../campaigns/dto/loyalty.dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { BranchesService } from '../branches/branches.service';

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

  // --- Profile Management ---

  async getProfile(
    userId: string,
    branchId?: string,
    businessId?: string,
  ): Promise<LoyaltyProfile> {
    const where: any = { userId };
    if (branchId) {
      where.branchId = branchId;
    } else if (businessId) {
      const profiles = await this.loyaltyProfileRepository.find({
        where: { userId, businessId },
        order: { points: 'DESC' } as any,
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
      } as any) as unknown as LoyaltyProfile;
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
    } as any) as unknown as Reward;
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

    const pointCost =
      (reward as any).pointCost || (reward as any).pointsRequired;

    if (profile.currentPointsBalance < pointCost) {
      throw new BadRequestException('Insufficient points');
    }

    return await this.dataSource.transaction(async (manager) => {
      profile.currentPointsBalance -= pointCost;
      profile.points = profile.currentPointsBalance;
      await manager.save(profile);

      const redemption = this.redemptionRepository.create({
        loyaltyProfile: profile,
        reward,
        pointsSpent: pointCost,
        status: 'completed',
        redemptionCode: Math.random().toString(36).substring(7).toUpperCase(),
      } as any) as unknown as Redemption;

      return await manager.save(redemption);
    });
  }

  // --- Transactions ---

  async earnPoints(branchId: string, dto: EarnPointsDto): Promise<any> {
    return this.campaignsService.earnPoints(branchId, dto);
  }

  async getHistory(userId: string, branchId?: string): Promise<any[]> {
    const where: any = { loyaltyProfile: { userId } };
    if (branchId) {
      where.loyaltyProfile.branchId = branchId;
    }

    const transactions = await this.transactionRepository.find({
      where,
      relations: ['loyaltyProfile', 'loyaltyProfile.branch'],
      order: { createdAt: 'DESC' } as any,
    });

    const redemptions = await this.redemptionRepository.find({
      where,
      relations: ['loyaltyProfile', 'loyaltyProfile.branch', 'reward'],
      order: { createdAt: 'DESC' } as any,
    });

    // Merge and sort
    return [...transactions, ...redemptions].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  // --- Taps ---

  async processTap(userId: string, code: string): Promise<any> {
    const device = await this.devicesService.findByCode(code);
    if (!device) throw new NotFoundException('Device not found');

    if (!userId) {
      // For guest visits, we could record a generic visit in the future
      // For now, just return success so the frontend flow continues smoothly
      return {
        success: true,
        message: 'Guest visit acknowledged',
        pointsEarned: 0,
      };
    }

    return this.earnPoints(device.branchId, { userId, isVisit: true });
  }
  async getDeviceByCode(code: string, userId?: string): Promise<any> {
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
      welcomeMessage: branch.welcomeMessage,
      rewardEnabled: branch.rewardEnabled,
      business: branch.business,
      businessId: branch.businessId,
      userProfile: profile,
      isFirstTimeVisit,
    };
  }

  // --- Stats ---

  async getAnalytics(userId: string): Promise<any> {
    const profiles = await this.getAllProfiles(userId);
    const totalPoints = profiles.reduce(
      (sum, p) => sum + ((p as any).points || 0),
      0,
    );
    const visitCount = await this.visitRepository.count({
      where: { customer: { id: userId } },
    });

    return {
      totalPoints,
      visitCount,
      activeMemberships: profiles.length,
      estimatedSavings: `₦${(totalPoints * 0.5).toLocaleString()}`, // Mock calc
    };
  }

  async getBusinessLoyaltyStats(
    branchId?: string,
    businessId?: string,
  ): Promise<any> {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    else if (businessId) where.businessId = businessId;

    const totalMembers = await this.loyaltyProfileRepository.count({ where });

    // sum helper might be tricky if column names vary
    const transactions = await this.transactionRepository.find({
      where: { loyaltyProfile: where },
    });
    const totalPointsIssued = transactions.reduce(
      (sum, t) => sum + ((t as any).points || 0),
      0,
    );

    const totalRedemptions = await this.redemptionRepository.count({
      where: { loyaltyProfile: where },
    });

    return {
      totalMembers,
      totalPointsIssued,
      totalRedemptions,
      redemptionRate:
        totalMembers > 0
          ? ((totalRedemptions / totalMembers) * 100).toFixed(1) + '%'
          : '0%',
    };
  }

  async checkVisit(userId: string, branchId: string): Promise<boolean> {
    const count = await this.visitRepository.count({
      where: { customer: { id: userId }, branchId },
    });
    return count > 0;
  }

  private calculateTier(points: number): TierLevel {
    if (points >= 5000) return TierLevel.PLATINUM;
    if (points >= 2000) return TierLevel.GOLD;
    if (points >= 500) return TierLevel.SILVER;
    return TierLevel.BRONZE;
  }
}
