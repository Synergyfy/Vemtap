import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyProfile, TierLevel } from './entities/loyalty-profile.entity';
import { Reward } from './entities/reward.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { Redemption } from './entities/redemption.entity';
import { CreateRewardDto } from './dto/create-reward.dto';
import { EarnPointsDto } from './dto/earn-points.dto';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(LoyaltyProfile)
    private loyaltyProfileRepository: Repository<LoyaltyProfile>,
    @InjectRepository(Reward)
    private rewardRepository: Repository<Reward>,
    @InjectRepository(LoyaltyTransaction)
    private transactionRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(Redemption)
    private redemptionRepository: Repository<Redemption>,
  ) {}

  // --- Profile Management ---

  async getProfile(userId: string, businessId: string): Promise<LoyaltyProfile> {
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

  async createReward(businessId: string, createRewardDto: CreateRewardDto): Promise<Reward> {
    const reward = this.rewardRepository.create({
      ...createRewardDto,
      businessId,
    });
    return this.rewardRepository.save(reward);
  }

  // --- Points Logic ---

  async earnPoints(businessId: string, dto: EarnPointsDto): Promise<LoyaltyProfile> {
    const profile = await this.getProfile(dto.userId, businessId);

    profile.totalPointsEarned += dto.amount;
    profile.currentPointsBalance += dto.amount;
    profile.lastVisitDate = new Date();
    profile.tierLevel = this.calculateTier(profile.totalPointsEarned);

    await this.loyaltyProfileRepository.save(profile);

    const transaction = this.transactionRepository.create({
      loyaltyProfileId: profile.id,
      transactionType: 'earn',
      pointsAmount: dto.amount,
      reason: dto.reason || 'Earned',
    });
    await this.transactionRepository.save(transaction);

    return profile;
  }

  async redeemReward(userId: string, businessId: string, rewardId: string): Promise<Redemption> {
    const profile = await this.getProfile(userId, businessId);
    const reward = await this.rewardRepository.findOne({ where: { id: rewardId } });

    if (!reward || !reward.isActive) {
      throw new BadRequestException('Invalid or inactive reward');
    }

    if (profile.currentPointsBalance < reward.pointCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points
    profile.currentPointsBalance -= reward.pointCost;
    profile.pointsRedeemed += reward.pointCost;
    await this.loyaltyProfileRepository.save(profile);

    // Create Transaction
    const transaction = this.transactionRepository.create({
      loyaltyProfileId: profile.id,
      transactionType: 'redeem',
      pointsAmount: -reward.pointCost,
      reason: `Redeemed ${reward.name}`,
    });
    await this.transactionRepository.save(transaction);

    // Create Redemption
    const redemption = this.redemptionRepository.create({
      loyaltyProfileId: profile.id,
      rewardId: reward.id,
      redemptionCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
      pointsSpent: reward.pointCost,
      status: 'pending',
      expiresAt: new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000),
      redeemedAt: new Date(),
    });

    return this.redemptionRepository.save(redemption);
  }

  async getHistory(userId: string, businessId?: string): Promise<LoyaltyTransaction[]> {
     const query = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.loyaltyProfile', 'profile')
      .where('profile.userId = :userId', { userId })
      .orderBy('transaction.createdAt', 'DESC');

    if (businessId) {
        query.andWhere('profile.businessId = :businessId', { businessId });
    }

    return query.getMany();
  }

  private calculateTier(points: number): TierLevel {
    if (points >= 5000) return TierLevel.PLATINUM;
    if (points >= 2000) return TierLevel.GOLD;
    if (points >= 500) return TierLevel.SILVER;
    return TierLevel.BRONZE;
  }
}
