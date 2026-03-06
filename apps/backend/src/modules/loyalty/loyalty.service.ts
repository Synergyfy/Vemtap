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
import { Redemption } from '../campaigns/entities/redemption.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { CreateLoyaltyRewardDto } from './dto/create-reward.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { DevicesService } from '../devices/devices.service';
import { Device, DeviceStatus } from '../devices/entities/device.entity';
import { CampaignsService } from '../campaigns/campaigns.service';
import { Visit } from '../visitors/entities/visit.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entities/user.entity';
import { Channel } from '../messaging/enums/channel.enum';

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
    private readonly dataSource: DataSource,
  ) {}

  // --- Profile Management ---

  async checkVisit(userId: string, businessId: string): Promise<boolean> {
    const visitCount = await this.visitRepository.count({
      where: { customerId: userId, businessId },
    });
    return visitCount > 0;
  }

  async getProfile(
    userId: string,
    businessId: string,
    branchId?: string,
  ): Promise<LoyaltyProfile & { totalVisits: number }> {
    const where: any = { userId, businessId };
    if (branchId) where.branchId = branchId;

    let profile = await this.loyaltyProfileRepository.findOne({
      where,
      relations: ['transactions', 'redemptions'],
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = this.loyaltyProfileRepository.create({
        userId,
        businessId,
        branchId,
        tierLevel: TierLevel.BRONZE,
      });
      await this.loyaltyProfileRepository.save(profile);
    }

    const totalVisits = await this.visitRepository.count({
      where: {
        customerId: userId,
        ...(branchId ? { branchId } : { businessId }),
      },
    });

    return { ...profile, totalVisits };
  }

  async getAllProfiles(userId: string): Promise<LoyaltyProfile[]> {
    return this.loyaltyProfileRepository.find({
      where: { userId },
      relations: ['business', 'branch'],
    });
  }

  // --- Rewards Management ---

  async getRewards(businessId: string, branchId?: string): Promise<Reward[]> {
    const where: any = { businessId, isActive: true };
    if (branchId) where.branchId = branchId;
    return this.rewardRepository.find({ where });
  }

  async createReward(
    businessId: string,
    createRewardDto: CreateLoyaltyRewardDto,
    branchId?: string,
  ): Promise<Reward> {
    const reward = this.rewardRepository.create({
      ...createRewardDto,
      businessId,
      branchId: branchId || createRewardDto.branchId,
    });
    return this.rewardRepository.save(reward);
  }

  // --- Points Logic ---

  async earnPoints(
    businessId: string,
    dto: EarnPointsDto,
    branchId?: string,
  ): Promise<LoyaltyProfile> {
    return this.dataSource.transaction(async (manager) => {
      // Find profile with pessimistic lock to prevent concurrent updates
      const where: any = { userId: dto.userId, businessId };
      if (branchId) where.branchId = branchId;

      let profile = await manager.findOne(LoyaltyProfile, {
        where,
        lock: { mode: 'pessimistic_write' },
      });

      if (!profile) {
        profile = manager.create(LoyaltyProfile, {
          userId: dto.userId,
          businessId,
          branchId,
          tierLevel: TierLevel.BRONZE,
        });
        await manager.save(profile);
      }

      profile.totalPointsEarned += dto.amount;
      profile.currentPointsBalance += dto.amount;
      profile.lastVisitDate = new Date();
      profile.tierLevel = this.calculateTier(profile.totalPointsEarned);

      await manager.save(profile);

      const transaction = manager.create(PointTransaction, {
        loyaltyProfile: profile,
        transactionType: 'earn',
        pointsAmount: dto.amount,
        reason: dto.reason || 'Earned',
      });
      await manager.save(transaction);

      return profile;
    });
  }

  async redeemReward(
    userId: string,
    businessId: string,
    rewardId: string,
  ): Promise<Redemption> {
    return this.dataSource.transaction(async (manager) => {
      const reward = await manager.findOne(Reward, { where: { id: rewardId } });

      if (!reward || !reward.isActive) {
        throw new BadRequestException('Invalid or inactive reward');
      }

      const profile = await manager.findOne(LoyaltyProfile, {
        where: { userId, businessId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!profile) {
        throw new BadRequestException('Profile not found');
      }

      if (profile.currentPointsBalance < reward.pointCost) {
        throw new BadRequestException('Insufficient points');
      }

      // Deduct points
      profile.currentPointsBalance -= reward.pointCost;
      profile.pointsRedeemed += reward.pointCost;
      await manager.save(profile);

      // Create Transaction
      const transaction = manager.create(PointTransaction, {
        loyaltyProfile: profile,
        transactionType: 'redeem',
        pointsAmount: -reward.pointCost,
        reason: `Redeemed ${reward.name}`,
      });
      await manager.save(transaction);

      // Create Redemption
      const redemption = manager.create(Redemption, {
        loyaltyProfile: profile,
        reward: reward,
        redemptionCode: Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase(),
        pointsSpent: reward.pointCost,
        status: 'pending',
        expiresAt: new Date(
          Date.now() + reward.validityDays * 24 * 60 * 60 * 1000,
        ),
        redeemedAt: new Date(),
      });

      return manager.save(redemption);
    });
  }

  async getHistory(
    userId: string,
    businessId?: string,
    branchId?: string,
  ): Promise<any[]> {
    // 1. Fetch Transactions (Earnings/Deductions)
    const txQuery = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.loyaltyProfile', 'profile')
      .leftJoinAndSelect('profile.business', 'business')
      .leftJoinAndSelect('profile.branch', 'branch')
      .where('profile.userId = :userId', { userId });

    if (businessId) {
      txQuery.andWhere('profile.businessId = :businessId', { businessId });
    }
    if (branchId) {
      txQuery.andWhere('profile.branchId = :branchId', { branchId });
    }

    const transactions = await txQuery
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();

    // 2. Fetch Redemptions
    const redQuery = this.redemptionRepository
      .createQueryBuilder('redemption')
      .leftJoinAndSelect('redemption.reward', 'reward')
      .leftJoinAndSelect('redemption.loyaltyProfile', 'profile')
      .leftJoinAndSelect('profile.business', 'business')
      .leftJoinAndSelect('profile.branch', 'branch')
      .where('profile.userId = :userId', { userId });

    if (businessId) {
      redQuery.andWhere('profile.businessId = :businessId', { businessId });
    }
    if (branchId) {
      redQuery.andWhere('profile.branchId = :branchId', { branchId });
    }

    const redemptions = await redQuery
      .orderBy('redemption.createdAt', 'DESC')
      .getMany();

    // 3. Fetch Visits
    const visitQuery = this.visitRepository
      .createQueryBuilder('visit')
      .leftJoinAndSelect('visit.business', 'business')
      .leftJoinAndSelect('visit.branch', 'branch')
      .where('visit.customerId = :userId', { userId });

    if (businessId) {
      visitQuery.andWhere('visit.businessId = :businessId', { businessId });
    }
    if (branchId) {
      visitQuery.andWhere('visit.branchId = :branchId', { branchId });
    }

    const visits = await visitQuery
      .orderBy('visit.createdAt', 'DESC')
      .getMany();

    // 4. Map to unified format
    const activity: any[] = [
      ...transactions.map((t) => ({
        id: t.id,
        type: t.transactionType === 'redeem' ? 'redemption' : 'earn',
        pointsAmount: t.pointsAmount,
        reason: t.reason,
        createdAt: t.createdAt,
        businessName: t.loyaltyProfile?.business?.name || 'Unknown Business',
        branchName: t.loyaltyProfile?.branch?.name,
        loyaltyProfile: t.loyaltyProfile,
      })),
      ...redemptions.map((r) => ({
        id: r.id,
        type: 'reward_claim',
        pointsAmount: -r.pointsSpent,
        reason: `Claimed ${r.reward?.name || 'Reward'}`,
        status: r.status,
        redemptionCode: r.redemptionCode,
        createdAt: r.createdAt,
        businessName: r.loyaltyProfile?.business?.name || 'Unknown Business',
        branchName: r.loyaltyProfile?.branch?.name,
        loyaltyProfile: r.loyaltyProfile,
      })),
      ...visits.map((v) => ({
        id: v.id,
        type: 'visit',
        pointsAmount: 0,
        reason: 'Business Visit',
        createdAt: v.createdAt,
        businessName: v.business?.name || 'Unknown Business',
        branchName: v.branch?.name,
        // visits don't have loyaltyProfile attached directly, but we can mock enough for frontend compat
        loyaltyProfile: { business: v.business },
      })),
    ];

    // 5. Sort by date descending
    return activity.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getDeviceByCode(code: string, userId?: string) {
    const device = await this.dataSource.getRepository(Device).findOne({
      where: { code, status: DeviceStatus.ACTIVE },
      relations: ['business', 'business.owner', 'branch'],
    });

    if (!device) {
      throw new NotFoundException('Device not found or inactive');
    }

    let isFirstTimeVisit = true;
    if (userId && device.businessId) {
      const visitCount = await this.dataSource.getRepository(Visit).count({
        where: { customerId: userId, businessId: device.businessId },
      });
      isFirstTimeVisit = visitCount === 0;
    }

    const { owner, ...businessInfo } = device.business || ({} as any);
    let ownerInfo: any = null;
    if (owner) {
      ownerInfo = {
        firstName: owner.firstName,
        lastName: owner.lastName,
        engagement: owner.engagement,
      };
    }

    return {
      id: device.id,
      name: device.name,
      code: device.code,
      type: device.type,
      business: businessInfo,
      branch: device.branch,
      owner: ownerInfo,
      isFirstTimeVisit,
    };
  }

  async processTap(userId: string, deviceCode: string): Promise<any> {
    // 1. Find device with relations
    const device = await this.dataSource.getRepository(Device).findOne({
      where: { code: deviceCode },
      relations: ['business', 'business.owner', 'branch'],
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // 2. Validate device
    if (device.status !== DeviceStatus.ACTIVE) {
      throw new BadRequestException('Device is inactive');
    }

    // 3. Increment total scans
    device.totalScans += 1;
    await this.dataSource.getRepository(Device).save(device);

    // 4. Earn points (Rule-based)
    let profile = await this.getProfile(userId, device.businessId);
    let pointsEarned = 0;
    const reason = 'Visit recorded';

    if (device.branchId) {
      const activeRule = await this.campaignsService.findActiveRule(
        device.branchId,
      );
      if (activeRule) {
        // We trigger the points earning through campaigns service
        const earnResult = await this.campaignsService.earnPoints(
          device.branchId,
          {
            userId,
            isVisit: true,
          },
        );
        // campaignsService already creates a PointTransaction
        pointsEarned = earnResult?.pointsEarned || 0;
        profile = await this.getProfile(userId, device.businessId);
      } else {
        // No active rule? We still want a record of this visit in the history
        const transaction = this.transactionRepository.create({
          loyaltyProfileId: profile.id,
          transactionType: 'earn',
          pointsAmount: 0,
          reason: 'Visit recorded (No points)',
        });
        await this.transactionRepository.save(transaction);
      }
    }

    // 5. Explicitly record in the Visitors/Visits table
    const user = await this.dataSource
      .getRepository(User)
      .findOneBy({ id: userId });

    if (user) {
      const visitRepo = this.dataSource.getRepository(Visit);
      const newVisit = visitRepo.create({
        customer: user,
        businessId: device.businessId,
        branchId: device.branchId,
        deviceId: device.id,
        status: 'returning',
      });
      await visitRepo.save(newVisit);

      // Contact Sync
      const contactRepo = this.dataSource.getRepository(Contact);
      let contact = await contactRepo.findOne({
        where: [
          { businessId: device.businessId, email: user.email },
          { businessId: device.businessId, phone: user.phone },
        ],
      });

      if (!contact) {
        contact = contactRepo.create({
          businessId: device.businessId,
          email: user.email,
          phone: user.phone,
          name: `${user.firstName} ${user.lastName}`.trim(),
          optInChannels: [Channel.SMS, Channel.EMAIL, Channel.WHATSAPP],
        });
        await contactRepo.save(contact);
      }
    }

    // 6. Return comprehensive info
    const { owner, ...businessInfo } = device.business || ({} as any);
    let ownerInfo: any = null;
    if (owner) {
      const { password, ...safeOwner } = owner;
      ownerInfo = safeOwner;
    }

    return {
      profile,
      business: businessInfo,
      branch: device.branch,
      owner: ownerInfo,
    };
  }

  async getAnalytics(userId: string) {
    const profiles = await this.getAllProfiles(userId);
    const transactions = await this.getHistory(userId);
    const redemptions = await this.redemptionRepository.find({
      where: { loyaltyProfile: { userId } },
      relations: ['reward'],
    });

    const totalVisits = await this.visitRepository.count({
      where: { customerId: userId },
    });

    const currentPointsBalance = profiles.reduce(
      (sum, p) => sum + p.currentPointsBalance,
      0,
    );

    // Net Savings: Value of all redeemed rewards
    // Assuming Reward entity has a 'value' field (which we added).
    const netSavings = redemptions.reduce(
      (sum, r) => sum + (Number(r.reward?.value) || 0),
      0,
    );

    // Points by Category (Mocking categories for now based on Business Type if available, else generic)
    // In a real app, Business entity would have a category.
    // For now, let's group by Business Name (or ID)
    const pointsByVenue = profiles.map((p) => ({
      venueName: p.business?.name || 'Unknown Venue', // Business name requires relation load in getAllProfiles
      points: p.totalPointsEarned,
    }));

    // Top Venues
    const topVenues = [...pointsByVenue]
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    // Visit Trends (Last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);

    const monthlyVisits = new Map<string, number>();

    transactions
      .filter(
        (t) =>
          t.transactionType === 'earn' && new Date(t.createdAt) >= sixMonthsAgo,
      )
      .forEach((t) => {
        const date = new Date(t.createdAt);
        const key = `${date.toLocaleString('default', { month: 'short' })}`;
        monthlyVisits.set(key, (monthlyVisits.get(key) || 0) + 1);
      });

    const visitTrends = Array.from(monthlyVisits.entries()).map(
      ([month, visits]) => ({ month, visits }),
    );

    return {
      totalVisits,
      currentPointsBalance,
      netSavings,
      visitTrends,
      pointsByVenue, // Renamed from category for now as we don't have business categories easily accessible
      topVenues,
    };
  }

  async getBusinessLoyaltyStats(businessId: string, branchId?: string) {
    const profileWhere: any = { businessId };
    if (branchId) profileWhere.branchId = branchId;

    // 1. Core Stats
    const totalMembers = await this.loyaltyProfileRepository.count({ where: profileWhere });
    
    const pointsResult = await this.loyaltyProfileRepository
      .createQueryBuilder('profile')
      .select('SUM(profile.totalPointsEarned)', 'totalPoints')
      .where('profile.businessId = :businessId', { businessId })
      .andWhere(branchId ? 'profile.branchId = :branchId' : '1=1', { branchId })
      .getRawOne();
    const totalPointsEarned = parseInt(pointsResult.totalPoints, 10) || 0;

    const redemptionWhere: any = { loyaltyProfile: { businessId } };
    if (branchId) redemptionWhere.loyaltyProfile.branchId = branchId;
    const rewardsClaimed = await this.redemptionRepository.count({ where: redemptionWhere });

    const redemptionRate = totalMembers > 0 ? Math.round((rewardsClaimed / totalMembers) * 100) : 0;

    // 2. Tier Distribution
    const tiers = await this.loyaltyProfileRepository
      .createQueryBuilder('profile')
      .select('profile.tierLevel', 'tier')
      .addSelect('COUNT(profile.id)', 'count')
      .where('profile.businessId = :businessId', { businessId })
      .andWhere(branchId ? 'profile.branchId = :branchId' : '1=1', { branchId })
      .groupBy('profile.tierLevel')
      .getRawMany();

    const tierDistribution = Object.values(TierLevel).map(level => {
      const match = tiers.find(t => t.tier === level);
      const count = match ? parseInt(match.count, 10) : 0;
      const percentage = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0;
      return { label: level.charAt(0).toUpperCase() + level.slice(1).toLowerCase(), value: percentage, count };
    });

    // 3. Activity Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const earningsTrendRaw = await this.transactionRepository
      .createQueryBuilder('tx')
      .innerJoin('tx.loyaltyProfile', 'profile')
      .select("TO_CHAR(tx.createdAt, 'Mon DD')", 'day')
      .addSelect("TO_CHAR(tx.createdAt, 'YYYY-MM-DD')", 'sortkey')
      .addSelect('SUM(tx.pointsAmount)', 'amount')
      .where('profile.businessId = :businessId', { businessId })
      .andWhere(branchId ? 'profile.branchId = :branchId' : '1=1', { branchId })
      .andWhere('tx.transactionType = :type', { type: 'earn' })
      .andWhere('tx.createdAt >= :date', { date: sevenDaysAgo })
      .groupBy('sortkey').addGroupBy('day')
      .orderBy('sortkey', 'ASC')
      .getRawMany();

    const claimsTrendRaw = await this.redemptionRepository
      .createQueryBuilder('red')
      .innerJoin('red.loyaltyProfile', 'profile')
      .select("TO_CHAR(red.createdAt, 'Mon DD')", 'day')
      .addSelect("TO_CHAR(red.createdAt, 'YYYY-MM-DD')", 'sortkey')
      .addSelect('COUNT(red.id)', 'count')
      .where('profile.businessId = :businessId', { businessId })
      .andWhere(branchId ? 'profile.branchId = :branchId' : '1=1', { branchId })
      .andWhere('red.createdAt >= :date', { date: sevenDaysAgo })
      .groupBy('sortkey').addGroupBy('day')
      .orderBy('sortkey', 'ASC')
      .getRawMany();

    // Fill gaps for last 7 days
    const activityTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayLabel = d.toLocaleString('default', { month: 'short', day: '2-digit' });
      const earnMatch = earningsTrendRaw.find(e => e.day === dayLabel);
      const claimMatch = claimsTrendRaw.find(c => c.day === dayLabel);
      return {
        name: d.toLocaleString('default', { weekday: 'short' }),
        earnings: earnMatch ? parseInt(earnMatch.amount, 10) : 0,
        claims: claimMatch ? parseInt(claimMatch.count, 10) : 0
      };
    });

    return {
      stats: [
        { label: 'Total Members', value: totalMembers.toLocaleString(), change: 0, trend: 'up' },
        { label: 'Points Earned', value: totalPointsEarned.toLocaleString(), change: 0, trend: 'up' },
        { label: 'Rewards Claimed', value: rewardsClaimed.toLocaleString(), change: 0, trend: 'up' },
        { label: 'Redemption Rate', value: `${redemptionRate}%`, change: 0, trend: 'up' },
      ],
      tierDistribution,
      activityTrend,
      growthForecast: '+0%' // We could calculate this based on month-over-month growth
    };
  }

  private calculateTier(points: number): TierLevel {
    if (points >= 5000) return TierLevel.PLATINUM;
    if (points >= 2000) return TierLevel.GOLD;
    if (points >= 500) return TierLevel.SILVER;
    return TierLevel.BRONZE;
  }
}
