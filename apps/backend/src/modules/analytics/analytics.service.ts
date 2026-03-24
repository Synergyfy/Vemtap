import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { MessageStatus } from '../messaging/enums/message.enum';
import { PointTransaction } from '../loyalty/entities/point-transaction.entity';
import { RedemptionCode } from '../loyalty/entities/redemption-code.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import {
  Business,
  BusinessStatus,
} from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from '../messaging/entities/message.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(MessageLog)
    private readonly logRepo: Repository<MessageLog>,
    @InjectRepository(PointTransaction)
    private readonly transactionRepo: Repository<PointTransaction>,
    @InjectRepository(RedemptionCode)
    private readonly redemptionRepo: Repository<RedemptionCode>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardAnalytics(user: User, branchId?: string) {
    const businessId = user.businessId;
    let targetBranchIds: string[] = [];

    if (branchId) {
      targetBranchIds = [branchId];
    } else if (businessId) {
      const branches = await this.branchRepo.find({
        where: { businessId },
        select: ['id'],
      });
      targetBranchIds = branches.map((b) => b.id);
    } else if (user.branchId) {
      targetBranchIds = [user.branchId];
    }

    if (targetBranchIds.length === 0) {
      return this.getEmptyMetrics();
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalVisitorsRaw, newVisitors, totalVisits, totalMessages] =
      await Promise.all([
        this.visitRepo
          .createQueryBuilder('visit')
          .where('visit.branchId IN (:...ids)', { ids: targetBranchIds })
          .select('COUNT(DISTINCT visit.customerId)', 'count')
          .getRawOne(),
        this.userRepo.count({
          where: {
            visits: {
              branchId: In(targetBranchIds),
              createdAt: MoreThan(today),
            },
          },
        }),
        this.visitRepo.count({
          where: { branchId: In(targetBranchIds) },
        }),
        this.messageRepo.count({
          where: { branchId: In(targetBranchIds) },
        }),
      ]);

    const totalVisitors = parseInt(totalVisitorsRaw?.count || '0', 10);

    return {
      stats: [
        { label: 'Total Visitors', value: totalVisitors },
        { label: 'New Visitors', value: newVisitors },
        { label: 'Total Taps', value: totalVisits },
        { label: 'Messages Sent', value: totalMessages },
      ],
      peakTimes: {},
      messagingRoi: {},
      engagementQuality: {},
      topPerformers: [],
    };
  }

  async getFootfallAnalytics(user: User, branchId?: string) {
    return {
      stats: [],
      hourlyData: [],
      trafficByEntrance: [],
      visitDuration: [],
    };
  }

  async getPeakTimesAnalytics(user: User, branchId?: string) {
    return {
      weeklyData: [],
      hoursLabels: [],
      smartSuggestion: '',
    };
  }

  async getAdminSummary() {
    const [totalUsers, totalBusinesses, activeSubscriptions, totalDevices] =
      await Promise.all([
        this.userRepo.count(),
        this.businessRepo.count(),
        this.subscriptionRepo.count({
          where: {
            status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]),
          },
        }),
        this.deviceRepo.count(),
      ]);

    return {
      stats: [
        { label: 'Total Business', value: totalBusinesses },
        { label: 'Total Users', value: totalUsers },
        { label: 'Total Active Subscriptions', value: activeSubscriptions },
        { label: 'Total Device', value: totalDevices },
      ],
      monthlyData: [],
      sectorSplit: [],
      securityAlerts: [],
    };
  }

  async getBusinessSummary() {
    const [active, pending, suspended, totalUsers] = await Promise.all([
      this.businessRepo.count({ where: { status: BusinessStatus.ACTIVE } }),
      this.businessRepo.count({ where: { status: BusinessStatus.PENDING } }),
      this.businessRepo.count({ where: { status: BusinessStatus.SUSPENDED } }),
      this.userRepo.count(),
    ]);

    return {
      totalActiveBusiness: active,
      totalPendingBusiness: pending,
      totalSuspendedBusiness: suspended,
      totalPlatformUsers: totalUsers,
    };
  }

  private getEmptyMetrics() {
    return {
      stats: [],
      peakTimes: {},
      messagingRoi: {},
      engagementQuality: {},
      topPerformers: [],
    };
  }
}
