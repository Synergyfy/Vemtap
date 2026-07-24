import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import {
  AffiliateProfile,
  KycStatus,
} from './entities/affiliate-profile.entity';
import { AffiliateReferral, ReferralStatus } from './entities/referral.entity';
import {
  AffiliateCommission,
  CommissionStatus,
} from './entities/commission.entity';
import {
  AffiliateWithdrawalRequest,
  WithdrawalStatus,
} from './entities/withdrawal-request.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SettingsService } from '../settings/settings.service';
import { ExternalAffiliateService } from './external-affiliate.service';
import { Business, BusinessStatus } from '../businesses/entities/business.entity';

@Injectable()
export class AffiliatesService {
  constructor(
    @InjectRepository(AffiliateProfile)
    private readonly profileRepository: Repository<AffiliateProfile>,
    @InjectRepository(AffiliateReferral)
    private readonly referralRepository: Repository<AffiliateReferral>,
    @InjectRepository(AffiliateCommission)
    private readonly commissionRepository: Repository<AffiliateCommission>,
    @InjectRepository(AffiliateWithdrawalRequest)
    private readonly withdrawalRepository: Repository<AffiliateWithdrawalRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly settingsService: SettingsService,
    private readonly dataSource: DataSource,
    private readonly externalAffiliateService: ExternalAffiliateService,
  ) {}

  /**
   * Shared helper: fetch user and throw if not found.
   * Avoids repeated userRepository.findOne calls across every public method.
   */
  private async resolveUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Helper to get or auto-create affiliate profile (Agents only).
   * Business owners/managers bypass this — their data lives in the Business table.
   */
  private async getOrCreateProfile(userId: string): Promise<AffiliateProfile> {
    let profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) {
      try {
        profile = await this.createProfile(userId);
        // Ensure user relation is fully loaded after creation
        if (!profile.user) {
          profile = await this.profileRepository.findOne({
            where: { id: profile.id },
            relations: ['user'],
          });
        }
      } catch (error) {
        // Handle concurrent profile creation — fetch the one that won the race
        profile = await this.profileRepository.findOne({
          where: { userId },
          relations: ['user'],
        });
        if (!profile) {
          throw error;
        }
      }
    }
    if (!profile) {
      throw new NotFoundException('Could not retrieve or create affiliate profile');
    }
    return profile;
  }

  /**
   * Creates an affiliate profile for a user
   */
  async createProfile(userId: string): Promise<AffiliateProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.profileRepository.findOne({
      where: { userId },
    });
    if (existing) return existing;

    // Generate a unique referral code
    const referralCode = await this.generateUniqueReferralCode(user.firstName);

    const profile = this.profileRepository.create({
      userId,
      referralCode,
    });

    return this.profileRepository.save(profile);
  }

  /**
   * Finds an affiliate profile by referral code
   */
  async findByReferralCode(code: string): Promise<AffiliateProfile | null> {
    return this.profileRepository.findOne({
      where: { referralCode: code.toUpperCase() },
      relations: ['user'],
    });
  }

  /**
   * Records a new referral
   */
  async recordReferral(
    affiliateId: string,
    referredBusinessId?: string,
    referredUserId?: string,
  ): Promise<AffiliateReferral> {
    const referral = this.referralRepository.create({
      affiliateId,
      referredBusinessId,
      referredUserId,
      status: ReferralStatus.PENDING,
    });

    return this.referralRepository.save(referral);
  }

  /**
   * Processes a subscription payment to generate commissions
   */
  async processSubscriptionCommission(
    businessId: string,
    amount: number,
    paymentId?: string,
  ) {
    const referral = await this.referralRepository.findOne({
      where: { referredBusinessId: businessId },
      relations: ['affiliate'],
    });

    if (!referral) return;

    // Convert referral if still pending
    if (referral.status === ReferralStatus.PENDING) {
      referral.status = ReferralStatus.CONVERTED;
      referral.convertedAt = new Date();
      await this.referralRepository.save(referral);
    }

    const settings = await this.settingsService.getGlobalSettings();
    const commissionRate = settings.affiliateDirectCommission || 20;
    const commissionAmount = (amount * commissionRate) / 100;

    const commission = this.commissionRepository.create({
      affiliateId: referral.affiliateId,
      referralId: referral.id,
      amount: commissionAmount,
      description: `Direct commission for business subscription payment`,
      status: CommissionStatus.PENDING,
      paymentId,
    });

    await this.commissionRepository.save(commission);

    // Update affiliate balance (In a real app, this might happen after payment verification)
    await this.updateAffiliateBalance(referral.affiliateId, commissionAmount);
  }

  /**
   * Gets stats for an affiliate's dashboard
   */
  async getStats(userId: string) {
    const user = await this.resolveUser(userId);

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const business = await businessRepository.findOne({ where: { ownerId: userId } });
      if (!business) {
        return {
          totalEarnings: 0,
          availableBalance: 0,
          totalReferrals: 0,
          activeReferrals: 0,
          referralCode: '',
          tier: 'Bronze',
        };
      }

      const totalReferrals = await businessRepository.count({
        where: { referralCode: business.uniqueCode },
      });

      const activeReferrals = await businessRepository.count({
        where: { referralCode: business.uniqueCode, status: BusinessStatus.ACTIVE },
      });

      return {
        totalEarnings: Number(business.balance),
        availableBalance: Number(business.balance),
        totalReferrals,
        activeReferrals,
        referralCode: business.uniqueCode,
        tier: 'Bronze',
      };
    }

    const profile = await this.getOrCreateProfile(userId);

    const totalReferrals = await this.referralRepository.count({
      where: { affiliateId: profile.id },
    });

    const activeReferrals = await this.referralRepository.count({
      where: { affiliateId: profile.id, status: ReferralStatus.CONVERTED },
    });

    return {
      totalEarnings: profile.totalEarnings,
      availableBalance: profile.availableBalance,
      totalReferrals,
      activeReferrals,
      referralCode: profile.referralCode,
      tier: profile.tier,
    };
  }

  /**
   * Gets a list of all referrals for an affiliate
   */
  async getReferrals(userId: string): Promise<any[]> {
    const user = await this.resolveUser(userId);

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const business = await businessRepository.findOne({ where: { ownerId: userId } });
      if (!business) return [];

      const referred = await businessRepository.find({
        where: { referralCode: business.uniqueCode },
        order: { createdAt: 'DESC' },
      });

      return referred.map(b => ({
        id: b.id,
        status: b.status === 'active' ? 'Converted' : 'Pending',
        createdAt: b.createdAt,
        referredBusiness: b,
      }));
    }

    const profile = await this.getOrCreateProfile(userId);

    return this.referralRepository.find({
      where: { affiliateId: profile.id },
      relations: ['referredBusiness'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Requests a withdrawal
   */
  async requestWithdrawal(
    userId: string,
    amount: number,
  ): Promise<AffiliateWithdrawalRequest> {
    const user = await this.resolveUser(userId);
    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      throw new BadRequestException(
        'Business owners manage withdrawals through the business finance flow',
      );
    }
    const profile = await this.getOrCreateProfile(userId);

    const settings = await this.settingsService.getGlobalSettings();
    const minWithdrawal = settings.affiliateMinimumWithdrawal || 5000;

    if (amount < minWithdrawal) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ₦${minWithdrawal}`,
      );
    }

    if (profile.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return this.dataSource.transaction(async (manager) => {
      // Re-fetch the profile inside the transaction with a write lock to prevent race conditions
      const txnProfile = await manager.findOne(AffiliateProfile, {
        where: { id: profile.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!txnProfile) {
        throw new NotFoundException('Affiliate profile not found');
      }

      if (Number(txnProfile.availableBalance) < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const request = manager.create(AffiliateWithdrawalRequest, {
        affiliateId: txnProfile.id,
        amount,
        status: WithdrawalStatus.PENDING,
      });

      txnProfile.availableBalance = Number(txnProfile.availableBalance) - amount;
      await manager.save(txnProfile);

      return manager.save(request);
    });
  }

  /**
   * Gets recent activity for an affiliate
   */
  async getActivity(userId: string, limit = 5): Promise<any[]> {
    const user = await this.resolveUser(userId);

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const business = await businessRepository.findOne({ where: { ownerId: userId } });
      if (!business) return [];

      const referred = await businessRepository.find({
        where: { referralCode: business.uniqueCode },
        order: { createdAt: 'DESC' },
        take: limit,
      });

      return referred.map(b => ({
        type: 'referral',
        title: 'New Partner Joined',
        desc: `${b.name} signed up`,
        time: b.createdAt,
      }));
    }

    const profile = await this.getOrCreateProfile(userId);

    const referrals = await this.referralRepository.find({
      where: { affiliateId: profile.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const commissions = await this.commissionRepository.find({
      where: { affiliateId: profile.id },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['referredBusiness'],
    });

    const withdrawals = await this.withdrawalRepository.find({
      where: { affiliateId: profile.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Combine and sort by date
    const activity = [
      ...referrals.map((r) => ({
        type: 'referral',
        title: 'New Referral',
        desc: `Referral signed up`,
        time: r.createdAt,
      })),
      ...commissions.map((c) => ({
        type: 'commission',
        title: 'Commission Earned',
        desc: `₦${c.amount} from ${c.referredBusiness?.name || 'Business'}`,
        time: c.createdAt,
      })),
      ...withdrawals.map((w) => ({
        type: 'withdrawal',
        title:
          w.status === WithdrawalStatus.PAID
            ? 'Withdrawal Paid'
            : 'Withdrawal Request',
        desc: `₦${w.amount} to your bank`,
        time: w.createdAt,
      })),
    ];

    return activity
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);
  }

  /**
   * Gets real earnings performance for chart (grouped by month)
   */
  async getPerformance(userId: string): Promise<any[]> {
    const user = await this.resolveUser(userId);

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const business = await businessRepository.findOne({ where: { ownerId: userId } });
      if (!business) {
        return monthNames.slice(0, 7).map((name) => ({ name, earnings: 0 }));
      }

      const rawData = await businessRepository
        .createQueryBuilder('b')
        .select("TO_CHAR(b.createdAt, 'Mon')", 'month')
        .addSelect('COUNT(b.id)', 'earnings')
        .where('b.referralCode = :referralCode', { referralCode: business.uniqueCode })
        .groupBy("TO_CHAR(b.createdAt, 'Mon')")
        .addGroupBy("DATE_TRUNC('month', b.createdAt)")
        .orderBy("DATE_TRUNC('month', b.createdAt)", 'ASC')
        .getRawMany();

      if (rawData.length === 0) {
        return monthNames.slice(0, 7).map((name) => ({ name, earnings: 0 }));
      }

      return rawData.map((item) => ({
        name: item.month,
        earnings: Number(item.earnings),
      }));
    }

    const profile = await this.getOrCreateProfile(userId);

    const rawData = await this.commissionRepository
      .createQueryBuilder('c')
      .select("TO_CHAR(c.createdAt, 'Mon')", 'month')
      .addSelect('SUM(c.amount)', 'earnings')
      .where('c.affiliateId = :affiliateId', { affiliateId: profile.id })
      .andWhere('c.status = :status', { status: CommissionStatus.PAID })
      .groupBy("TO_CHAR(c.createdAt, 'Mon')")
      .addGroupBy("DATE_TRUNC('month', c.createdAt)")
      .orderBy("DATE_TRUNC('month', c.createdAt)", 'ASC')
      .getRawMany();

    // Ensure we have at least some data for the chart to render nicely
    if (rawData.length === 0) {
      return monthNames.slice(0, 7).map((name) => ({ name, earnings: 0 }));
    }

    return rawData.map((item) => ({
      name: item.month,
      earnings: Number(item.earnings),
    }));
  }

  /**
   * Gets leaderboard (filtered by role type to separate agents vs business owners)
   */
  async getLeaderboard(currentUserRole?: UserRole, limit = 10): Promise<any[]> {
    if (currentUserRole === UserRole.OWNER || currentUserRole === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const rawLeaderboard = await businessRepository
        .createQueryBuilder('b')
        .select('b.referralCode', 'referralCode')
        .addSelect('COUNT(b.id)', 'referredCount')
        .where('b.referralCode IS NOT NULL')
        .groupBy('b.referralCode')
        .orderBy('COUNT(b.id)', 'DESC')
        .take(limit)
        .getRawMany();

      const uniqueCodes = rawLeaderboard.map(item => item.referralCode).filter(Boolean);
      if (uniqueCodes.length === 0) return [];

      const referringBusinesses = await businessRepository.find({
        where: { uniqueCode: In(uniqueCodes) },
      });

      return rawLeaderboard
        .map((item, idx) => {
          const referring = referringBusinesses.find(b => b.uniqueCode === item.referralCode);
          if (!referring) return null;
          return {
            name: referring.name,
            earnings: Number(referring.balance),
            rank: idx + 1,
            avatar: referring.logoUrl || null,
            referred: Number(item.referredCount),
            points: Number(item.referredCount) * 100,
          };
        })
        .filter(Boolean);
    }

    const qb = this.profileRepository.createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'u');

    if (currentUserRole) {
      if (currentUserRole === UserRole.AGENT) {
        qb.where('u.role = :role', { role: UserRole.AGENT });
      }
    }

    qb.orderBy('p.totalEarnings', 'DESC')
      .take(limit);

    const topProfiles = await qb.getMany();

    return topProfiles.map((p, idx) => ({
      name: `${p.user.firstName} ${p.user.lastName}`,
      earnings: p.totalEarnings,
      rank: idx + 1,
      avatar: p.user.avatar,
    }));
  }

  /**
   * Gets the full profile for an affiliate
   */
  async getProfile(userId: string): Promise<AffiliateProfile | Record<string, unknown>> {
    const user = await this.resolveUser(userId);

    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      const businessRepository = this.dataSource.getRepository(Business);
      const business = await businessRepository.findOne({ where: { ownerId: userId } });
      if (!business) throw new NotFoundException('Business not found');

      // Return a business-shaped profile summary — NOT an AffiliateProfile.
      // kycStatus reflects the actual business status rather than a hardcoded value.
      return {
        id: business.id,
        userId,
        referralCode: business.uniqueCode,
        totalEarnings: Number(business.balance),
        availableBalance: Number(business.balance),
        kycStatus: business.status === BusinessStatus.ACTIVE ? KycStatus.VERIFIED : KycStatus.PENDING,
        bankAccountDetails: null,
      };
    }

    return this.getOrCreateProfile(userId);
  }

  /**
   * Updates an affiliate profile (KYC & Bank details)
   */
  async updateProfile(userId: string, data: any): Promise<AffiliateProfile> {
    const user = await this.resolveUser(userId);
    if (user.role === UserRole.OWNER || user.role === UserRole.MANAGER) {
      throw new BadRequestException(
        'Business owners do not have an affiliate profile to update',
      );
    }
    const profile = await this.getOrCreateProfile(userId);

    if (data.bankAccountDetails) {
      profile.bankAccountDetails = {
        ...profile.bankAccountDetails,
        ...data.bankAccountDetails,
      };
    }

    if (data.idType) profile.idType = data.idType;
    if (data.idNumber) profile.idNumber = data.idNumber;
    if (data.idImageUrl) profile.idImageUrl = data.idImageUrl;

    // Auto-set KYC to pending if all details are provided
    if (
      profile.idType &&
      profile.idNumber &&
      profile.idImageUrl &&
      profile.kycStatus === KycStatus.UNVERIFIED
    ) {
      profile.kycStatus = KycStatus.PENDING;
    }

    return this.profileRepository.save(profile);
  }

  // --- Admin Methods ---

  /**
   * List all withdrawal requests (Admin only)
   */
  async getAllWithdrawals(status?: WithdrawalStatus) {
    const where = status ? { status } : {};
    return this.withdrawalRepository.find({
      where,
      relations: ['affiliate', 'affiliate.user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Process a withdrawal request (Admin only)
   */
  async processWithdrawal(
    id: string,
    adminId: string,
    status: WithdrawalStatus,
    note?: string,
  ) {
    // Pre-flight check outside transaction to give early errors
    const existing = await this.withdrawalRepository.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Withdrawal request not found');
    if (
      existing.status !== WithdrawalStatus.PENDING &&
      existing.status !== WithdrawalStatus.APPROVED
    ) {
      throw new BadRequestException('Request has already been processed or rejected');
    }

    // If PAID, fire external sync BEFORE the transaction (network call shouldn't hold a DB lock)
    if (status === WithdrawalStatus.PAID) {
      const profile = await this.profileRepository.findOne({
        where: { id: existing.affiliateId },
        relations: ['user'],
      });
      if (profile?.bankAccountDetails) {
        try {
          await this.externalAffiliateService.processWithdrawal({
            email: profile.user.email,
            amount: Number(existing.amount),
            bankName: profile.bankAccountDetails.bankName,
            accountNumber: profile.bankAccountDetails.accountNumber,
            accountName: profile.bankAccountDetails.accountName,
            reference: existing.id,
          });
        } catch (error: any) {
          console.error(
            'Failed to sync withdrawal with external affiliate system:',
            error.message,
          );
          // Log but don't block — DB update proceeds regardless
        }
      }
    }

    // Wrap both the status update and the optional refund in a single transaction
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.findOne(AffiliateWithdrawalRequest, {
        where: { id },
        relations: ['affiliate'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!request) throw new NotFoundException('Withdrawal request not found');

      request.status = status;
      request.processedById = adminId;
      request.processedAt = new Date();
      request.note = note || request.note;

      // If rejected, refund the balance atomically inside the same transaction
      if (status === WithdrawalStatus.REJECTED) {
        await manager
          .createQueryBuilder()
          .update(AffiliateProfile)
          .set({
            availableBalance: () => `"availableBalance" + ${Number(request.amount)}`,
          })
          .where('id = :id', { id: request.affiliateId })
          .execute();
      }

      return manager.save(request);
    });
  }

  /**
   * Get global stats for all affiliates (Admin only)
   */
  async getGlobalAdminStats() {
    const totalEarnings = await this.profileRepository
      .createQueryBuilder('p')
      .select('SUM(p.totalEarnings)', 'sum')
      .getRawOne();

    const totalWithdrawals = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'sum')
      .where('w.status = :status', { status: WithdrawalStatus.PAID })
      .getRawOne();

    const totalReferrals = await this.referralRepository.count();
    const activeAffiliates = await this.profileRepository.count({
      where: { kycStatus: KycStatus.VERIFIED },
    });
    const fraudAlerts = await this.profileRepository.count({
      where: { isFlagged: true },
    });

    const pendingPayoutsAmount = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'sum')
      .where('w.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    const approvedPayoutsAmount = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'sum')
      .where('w.status = :status', { status: WithdrawalStatus.APPROVED })
      .getRawOne();

    // Calculate total revenue from referred business subscriptions
    // This is estimated as (Commissions Paid / Direct Commission Rate)
    const settings = await this.settingsService.getGlobalSettings();
    const rate = settings.affiliateDirectCommission || 20;
    const estimatedRevenue = (Number(totalEarnings?.sum || 0) * 100) / rate;

    return {
      totalCommissionsPaid: Number(totalEarnings?.sum || 0),
      pendingPayouts: Number(pendingPayoutsAmount?.sum || 0),
      approvedPayouts: Number(approvedPayoutsAmount?.sum || 0),
      completedPayouts: Number(totalWithdrawals?.sum || 0),
      totalReferrals,
      activeAffiliates,
      fraudAlerts,
      totalRevenue: estimatedRevenue,
    };
  }

  /**
   * Get recent fraud alerts (Admin only)
   */
  async getFraudAlerts() {
    return this.profileRepository.find({
      where: { isFlagged: true },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Get all affiliate profiles (Admin only)
   */
  async getAllProfilesAdmin() {
    return this.profileRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all referrals (Admin only)
   */
  async getAllReferralsAdmin() {
    return this.referralRepository.find({
      relations: ['affiliate', 'affiliate.user', 'referredBusiness'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all commissions (Admin only)
   */
  async getAllCommissionsAdmin() {
    return this.commissionRepository.find({
      relations: ['affiliate', 'affiliate.user', 'referredBusiness'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update global commission settings (Admin only)
   */
  async updateCommissionSettings(directRate: number, indirectRate?: number) {
    return this.settingsService.updateSettings({
      affiliateDirectCommission: directRate,
      affiliateIndirectCommission: indirectRate,
    } as any);
  }

  /**
   * Flag/Unflag an affiliate for fraud (Admin only)
   */
  async toggleAffiliateFlag(id: string, isFlagged: boolean, reason?: string) {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    profile.isFlagged = isFlagged;
    profile.fraudReason = reason || profile.fraudReason;

    return this.profileRepository.save(profile);
  }

  /**
   * Verify/Reject KYC for an affiliate (Admin only)
   */
  async updateKycStatus(id: string, status: KycStatus) {
    const profile = await this.profileRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Profile not found');

    profile.kycStatus = status;
    return this.profileRepository.save(profile);
  }

  async trackVisit(referralCode: string) {
    const profile = await this.profileRepository.findOne({
      where: { referralCode: referralCode.toUpperCase() },
      relations: ['user'],
    });
    return { tracked: true, valid: !!profile };
  }

  async getReferrerInfo(code: string) {
    const profile = await this.profileRepository.findOne({
      where: { referralCode: code.toUpperCase() },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Invalid referral code');
    }
    const businessRepo = this.dataSource.getRepository(Business);
    const business = await businessRepo.findOne({
      where: { ownerId: profile.userId },
    });
    return {
      referralCode: profile.referralCode,
      businessName: business?.name || profile.user.firstName || 'A VEMTAP partner',
    };
  }

  // --- Private Helpers ---

  private async generateUniqueReferralCode(firstName: string): Promise<string> {
    const prefix = firstName.substring(0, 3).toUpperCase();
    let isUnique = false;
    let code = '';

    while (!isUnique) {
      const random = Math.floor(1000 + Math.random() * 9000);
      code = `VEM-${prefix}-${random}`;
      const existing = await this.profileRepository.findOne({
        where: { referralCode: code },
      });
      if (!existing) isUnique = true;
    }

    return code;
  }

  private async updateAffiliateBalance(affiliateId: string, amount: number) {
    // Atomic increment — avoids read-modify-write race condition under concurrent commission processing
    await this.profileRepository
      .createQueryBuilder()
      .update(AffiliateProfile)
      .set({
        totalEarnings: () => `"totalEarnings" + ${amount}`,
        availableBalance: () => `"availableBalance" + ${amount}`,
      })
      .where('id = :id', { id: affiliateId })
      .execute();
  }
}
