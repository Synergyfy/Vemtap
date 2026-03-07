import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User } from '../users/entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { MessageLog } from '../messaging/entities/message-log.entity';
import { MessageStatus } from '../messaging/enums/message.enum';
import { LoyaltyProfile } from '../campaigns/entities/loyalty-profile.entity';
import { PointTransaction } from '../campaigns/entities/point-transaction.entity';
import { Redemption } from '../campaigns/entities/redemption.entity';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Message } from '../messaging/entities/message.entity';

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
    @InjectRepository(LoyaltyProfile)
    private readonly loyaltyRepo: Repository<LoyaltyProfile>,
    @InjectRepository(PointTransaction)
    private readonly transactionRepo: Repository<PointTransaction>,
    @InjectRepository(Redemption)
    private readonly redemptionRepo: Repository<Redemption>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
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
    const [totalUsers, totalBusinesses, activeCampaigns] = await Promise.all([
      this.userRepo.count(),
      this.businessRepo.count(),
      this.messageRepo.count({ where: { status: MessageStatus.SENT } }),
    ]);

    return {
      stats: [
        { label: 'Total Users', value: totalUsers },
        { label: 'Total Businesses', value: totalBusinesses },
        { label: 'Active Campaigns', value: activeCampaigns },
        { label: 'Platform Growth', value: '12%' },
      ],
      monthlyData: [],
      sectorSplit: [],
      securityAlerts: [],
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
