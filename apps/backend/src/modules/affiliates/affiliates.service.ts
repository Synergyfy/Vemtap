import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AffiliateProfile, KycStatus } from './entities/affiliate-profile.entity';
import { AffiliateReferral, ReferralStatus } from './entities/referral.entity';
import { AffiliateCommission, CommissionStatus } from './entities/commission.entity';
import { AffiliateWithdrawalRequest, WithdrawalStatus } from './entities/withdrawal-request.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { SettingsService } from '../settings/settings.service';

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
  ) {}

  /**
   * Creates an affiliate profile for a user
   */
  async createProfile(userId: string): Promise<AffiliateProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.profileRepository.findOne({ where: { userId } });
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
  async recordReferral(affiliateId: string, referredBusinessId?: string, referredUserId?: string): Promise<AffiliateReferral> {
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
  async processSubscriptionCommission(businessId: string, amount: number, paymentId?: string) {
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
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    if (!profile) throw new NotFoundException('Affiliate profile not found');

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
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Affiliate profile not found');

    return this.referralRepository.find({
      where: { affiliateId: profile.id },
      relations: ['referredBusiness'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Requests a withdrawal
   */
  async requestWithdrawal(userId: string, amount: number): Promise<AffiliateWithdrawalRequest> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Affiliate profile not found');

    const settings = await this.settingsService.getGlobalSettings();
    const minWithdrawal = settings.affiliateMinimumWithdrawal || 5000;

    if (amount < minWithdrawal) {
      throw new BadRequestException(`Minimum withdrawal amount is ₦${minWithdrawal}`);
    }

    if (profile.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const request = this.withdrawalRepository.create({
      affiliateId: profile.id,
      amount,
      status: WithdrawalStatus.PENDING,
    });

    // Deduct from available balance immediately to prevent double spending
    profile.availableBalance -= amount;
    await this.profileRepository.save(profile);

    return this.withdrawalRepository.save(request);
  }

  /**
   * Gets recent activity for an affiliate
   */
  async getActivity(userId: string, limit = 5): Promise<any[]> {
    const referrals = await this.referralRepository.find({
      where: { affiliateId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const commissions = await this.commissionRepository.find({
      where: { affiliateId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['referredBusiness'],
    });

    const withdrawals = await this.withdrawalRepository.find({
      where: { affiliateId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Combine and sort by date
    const activity = [
      ...referrals.map(r => ({ type: 'referral', title: 'New Referral', desc: `Referral signed up`, time: r.createdAt })),
      ...commissions.map(c => ({ 
        type: 'commission', 
        title: 'Commission Earned', 
        desc: `₦${c.amount} from ${c.referredBusiness?.name || 'Business'}`, 
        time: c.createdAt 
      })),
      ...withdrawals.map(w => ({ 
        type: 'withdrawal', 
        title: w.status === WithdrawalStatus.PAID ? 'Withdrawal Paid' : 'Withdrawal Request', 
        desc: `₦${w.amount} to your bank`, 
        time: w.createdAt 
      })),
    ];

    return activity.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, limit);
  }

  /**
   * Gets real earnings performance for chart (grouped by month)
   */
  async getPerformance(userId: string): Promise<any[]> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Affiliate profile not found');

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

    // Map to frontend format
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Ensure we have at least some data for the chart to render nicely
    if (rawData.length === 0) {
      return monthNames.slice(0, 7).map(name => ({ name, earnings: 0 }));
    }

    return rawData.map(item => ({
      name: item.month,
      earnings: Number(item.earnings),
    }));
  }

  /**
   * Gets leaderboard
   */
  async getLeaderboard(limit = 10): Promise<any[]> {
    const topProfiles = await this.profileRepository.find({
      order: { totalEarnings: 'DESC' },
      take: limit,
      relations: ['user'],
    });

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
  async getProfile(userId: string): Promise<AffiliateProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Affiliate profile not found');
    return profile;
  }

  /**
   * Updates an affiliate profile (KYC & Bank details)
   */
  async updateProfile(userId: string, data: any): Promise<AffiliateProfile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Affiliate profile not found');

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
    if (profile.idType && profile.idNumber && profile.idImageUrl && profile.kycStatus === KycStatus.UNVERIFIED) {
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
  async processWithdrawal(id: string, adminId: string, status: WithdrawalStatus, note?: string) {
    const request = await this.withdrawalRepository.findOne({ 
      where: { id },
      relations: ['affiliate'] 
    });
    
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (request.status !== WithdrawalStatus.PENDING && request.status !== WithdrawalStatus.APPROVED) {
      throw new BadRequestException('Request has already been processed or rejected');
    }

    request.status = status;
    request.processedById = adminId;
    request.processedAt = new Date();
    request.note = note || request.note;

    // If rejected, refund the balance
    if (status === WithdrawalStatus.REJECTED) {
      const profile = request.affiliate;
      profile.availableBalance = Number(profile.availableBalance) + Number(request.amount);
      await this.profileRepository.save(profile);
    }

    return this.withdrawalRepository.save(request);
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
    const activeAffiliates = await this.profileRepository.count({ where: { kycStatus: KycStatus.VERIFIED } });
    const fraudAlerts = await this.profileRepository.count({ where: { isFlagged: true } });

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

  // --- Private Helpers ---

  private async generateUniqueReferralCode(firstName: string): Promise<string> {
    const prefix = firstName.substring(0, 3).toUpperCase();
    let isUnique = false;
    let code = '';

    while (!isUnique) {
      const random = Math.floor(1000 + Math.random() * 9000);
      code = `VEM-${prefix}-${random}`;
      const existing = await this.profileRepository.findOne({ where: { referralCode: code } });
      if (!existing) isUnique = true;
    }

    return code;
  }

  private async updateAffiliateBalance(affiliateId: string, amount: number) {
    const profile = await this.profileRepository.findOne({ where: { id: affiliateId } });
    if (profile) {
      profile.totalEarnings = Number(profile.totalEarnings) + Number(amount);
      profile.availableBalance = Number(profile.availableBalance) + Number(amount);
      await this.profileRepository.save(profile);
    }
  }
}
