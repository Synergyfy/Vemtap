import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoyaltyProfile, TierLevel } from '../campaigns/entities/loyalty-profile.entity';
import { Reward } from '../campaigns/entities/reward.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { CreateRewardDto } from './dto/create-reward.dto';
import { EarnPointsDto } from './dto/earn-points.dto';
import { DevicesService } from '../devices/devices.service';
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
    private readonly devicesService: DevicesService,
    private readonly dataSource: DataSource,
  ) { }

  // --- Profile Management ---

  async getProfile(
    userId: string,
    businessId: string,
  ): Promise<LoyaltyProfile> {
    let profile = await this.loyaltyProfileRepository.findOne({
      where: { userId, businessId },
      relations: ['transactions', 'redemptions'],
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = this.loyaltyProfileRepository.create({
        userId,
        businessId,
        tierLevel: TierLevel.BRONZE,
      });
      await this.loyaltyProfileRepository.save(profile);
    }

    return profile;
  }

  async getAllProfiles(userId: string): Promise<LoyaltyProfile[]> {
    return this.loyaltyProfileRepository.find({
      where: { userId },
      relations: ['business'],
    });
  }

  // --- Rewards Management ---

  async getRewards(businessId: string): Promise<Reward[]> {
    return this.rewardRepository.find({
      where: { businessId, isActive: true },
    });
  }

  async createReward(
    businessId: string,
    createRewardDto: CreateRewardDto,
  ): Promise<Reward> {
    const reward = this.rewardRepository.create({
      ...createRewardDto,
      businessId,
    });
    return this.rewardRepository.save(reward);
  }

  // --- Points Logic ---

  async earnPoints(
    businessId: string,
    dto: EarnPointsDto,
  ): Promise<LoyaltyProfile> {
    return this.dataSource.transaction(async (manager) => {
      // Find profile with pessimistic lock to prevent concurrent updates
      let profile = await manager.findOne(LoyaltyProfile, {
        where: { userId: dto.userId, businessId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!profile) {
        // Create profile if it doesn't exist (need to create without lock first, or just create)
        // Since we are inside a transaction, creating it here is fine.
        profile = manager.create(LoyaltyProfile, {
          userId: dto.userId,
          businessId,
          tierLevel: TierLevel.BRONZE,
        });
        await manager.save(profile);
        // Re-fetch with lock? Not needed if we just created it and hold transaction.
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
  ): Promise<PointTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.loyaltyProfile', 'profile')
      .where('profile.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (businessId) {
      query.andWhere('profile.businessId = :businessId', { businessId });
    }

    return query.getMany();
  }

  async getDeviceByCode(code: string) {
    const device = await this.devicesService.findByCode(code);
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    if (device.status !== 'active') {
      throw new BadRequestException('Device is inactive');
    }
    // Return device with business and branch details
    return {
      id: device.id,
      name: device.name,
      code: device.code,
      type: device.type,
      business: device.business,
      branch: device.branch,
    };
  }

  async processTap(
    userId: string,
    deviceCode: string,
  ): Promise<LoyaltyProfile> {
    // 1. Find device
    const device = await this.devicesService.findByCode(deviceCode);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    // 2. Validate device (e.g. check if active)
    if (device.status !== 'active') {
      throw new BadRequestException('Device is inactive');
    }

    // 3. Increment total scans
    device.totalScans += 1;
    await this.devicesService.adminUpdate(device.id, {
      totalScans: device.totalScans,
    });

    // 4. Earn points (Visit)
    // Default 10 points for a visit for now
    const pointsAmount = 10;
    const profile = await this.earnPoints(device.businessId, {
      userId,
      amount: pointsAmount,
      reason: 'Visit Tap',
    });

    // 5. Explicitly record in the Visitors/Visits table
    // Fetch user to ensure we have context
    const user = await this.dataSource.getRepository(User).findOneBy({ id: userId });

    if (user) {
      const visitRepo = this.dataSource.getRepository(Visit);
      const newVisit = visitRepo.create({
        customer: user,
        businessId: device.businessId,
        branchId: device.branchId, // Inherit branch from device if it exists
        deviceId: device.id,
        status: 'returning', // Taps are by existing logged-in users
      });
      await visitRepo.save(newVisit);

      // Check/Create Contact for the business
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

    return profile;
  }

  async getAnalytics(userId: string) {
    const profiles = await this.getAllProfiles(userId);
    const transactions = await this.getHistory(userId);
    const redemptions = await this.redemptionRepository.find({
      where: { loyaltyProfile: { userId } },
      relations: ['reward'],
    });

    const totalVisits = transactions.filter(
      (t) => t.transactionType === 'earn',
    ).length;

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

  private calculateTier(points: number): TierLevel {
    if (points >= 5000) return TierLevel.PLATINUM;
    if (points >= 2000) return TierLevel.GOLD;
    if (points >= 500) return TierLevel.SILVER;
    return TierLevel.BRONZE;
  }
}
