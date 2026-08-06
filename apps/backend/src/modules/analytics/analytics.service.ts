import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

  private async getTargetBranchIds(
    user: User,
    branchId?: string,
  ): Promise<string[]> {
    if (branchId && branchId !== 'all') {
      return [branchId];
    }
    if (user.businessId) {
      const branches = await this.branchRepo.find({
        where: { businessId: user.businessId },
        select: ['id'],
      });
      return branches.map((b) => b.id);
    }
    if (user.branchId) {
      return [user.branchId];
    }
    return [];
  }

  async getFootfallAnalytics(user: User, branchId?: string) {
    try {
      const targetBranchIds = await this.getTargetBranchIds(user, branchId);
      if (targetBranchIds.length === 0) {
        const hoursLabels = [
          '8 AM',
          '9 AM',
          '10 AM',
          '11 AM',
          '12 PM',
          '1 PM',
          '2 PM',
          '3 PM',
          '4 PM',
          '5 PM',
          '6 PM',
          '7 PM',
          '8 PM',
          '9 PM',
        ];
        return {
          stats: [
            { label: 'Total Footfall', value: '0' },
            { label: 'Unique Visitors', value: '0' },
            { label: 'Repeat Visits', value: '0' },
            { label: 'Avg Daily Visits', value: '0' },
          ],
          hourlyData: hoursLabels.map((hour) => ({ hour, count: 0 })),
          trafficByEntrance: [
            { name: 'Main Entrance Counter', count: 0, percentage: '0%' },
          ],
        };
      }

      const [totalVisits, uniqueRaw, hourlyRaw, entranceRaw] =
        await Promise.all([
          this.visitRepo.count({
            where: { branchId: In(targetBranchIds) },
          }),
          this.visitRepo
            .createQueryBuilder('visit')
            .where('visit.branchId IN (:...ids)', { ids: targetBranchIds })
            .select('COUNT(DISTINCT visit.customerId)', 'count')
            .getRawOne(),
          this.visitRepo
            .createQueryBuilder('visit')
            .where('visit.branchId IN (:...ids)', { ids: targetBranchIds })
            .select('EXTRACT(HOUR FROM visit.createdAt)', 'hour')
            .addSelect('COUNT(visit.id)', 'count')
            .groupBy('EXTRACT(HOUR FROM visit.createdAt)')
            .orderBy('hour', 'ASC')
            .getRawMany(),
          this.visitRepo
            .createQueryBuilder('visit')
            .leftJoin('visit.device', 'device')
            .where('visit.branchId IN (:...ids)', { ids: targetBranchIds })
            .select(
              "COALESCE(device.name, device.code, 'Main Entrance')",
              'entrance',
            )
            .addSelect('COUNT(visit.id)', 'count')
            .groupBy(
              "COALESCE(device.name, device.code, 'Main Entrance')",
            )
            .getRawMany(),
        ]);

      const uniqueVisitors = parseInt(uniqueRaw?.count || '0', 10);
      const repeatVisits = Math.max(0, totalVisits - uniqueVisitors);

      const hourlyMap = new Map<number, number>();
      (hourlyRaw || []).forEach((row) => {
        const h = parseInt(row.hour, 10);
        hourlyMap.set(h, parseInt(row.count, 10));
      });

      const hoursLabels = [
        '8 AM',
        '9 AM',
        '10 AM',
        '11 AM',
        '12 PM',
        '1 PM',
        '2 PM',
        '3 PM',
        '4 PM',
        '5 PM',
        '6 PM',
        '7 PM',
        '8 PM',
        '9 PM',
      ];

      const hourlyData = hoursLabels.map((label, idx) => {
        const hourNum = idx + 8;
        return {
          hour: label,
          count: hourlyMap.get(hourNum) || 0,
        };
      });

      const trafficByEntrance = (entranceRaw || []).map((row) => {
        const cnt = parseInt(row.count, 10);
        const pct =
          totalVisits > 0 ? `${Math.round((cnt / totalVisits) * 100)}%` : '0%';
        return {
          name: row.entrance,
          count: cnt,
          percentage: pct,
        };
      });

      return {
        stats: [
          { label: 'Total Footfall', value: totalVisits.toLocaleString() },
          { label: 'Unique Visitors', value: uniqueVisitors.toLocaleString() },
          { label: 'Repeat Visits', value: repeatVisits.toLocaleString() },
          {
            label: 'Avg Daily Visits',
            value: Math.ceil(totalVisits / 30).toLocaleString(),
          },
        ],
        hourlyData,
        trafficByEntrance:
          trafficByEntrance.length > 0
            ? trafficByEntrance
            : [
                {
                  name: 'Main Entrance Counter',
                  count: totalVisits,
                  percentage: '100%',
                },
              ],
      };
    } catch (error) {
      this.logger.error(
        '[AnalyticsService] Error in getFootfallAnalytics:',
        error,
      );
      throw error;
    }
  }

  async getPeakTimesAnalytics(user: User, branchId?: string) {
    try {
      const targetBranchIds = await this.getTargetBranchIds(user, branchId);
      const hoursLabels = [
        '8 AM',
        '9 AM',
        '10 AM',
        '11 AM',
        '12 PM',
        '1 PM',
        '2 PM',
        '3 PM',
        '4 PM',
        '5 PM',
      ];
      const days = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ];

      if (targetBranchIds.length === 0) {
        return {
          hoursLabels,
          weeklyData: days.map((day) => ({
            day,
            hours: new Array(10).fill(0),
          })),
          smartSuggestion: null,
        };
      }

      const rawMatrix = await this.visitRepo
        .createQueryBuilder('visit')
        .where('visit.branchId IN (:...ids)', { ids: targetBranchIds })
        .select('EXTRACT(ISODOW FROM visit.createdAt)', 'dow')
        .addSelect('EXTRACT(HOUR FROM visit.createdAt)', 'hour')
        .addSelect('COUNT(visit.id)', 'count')
        .groupBy('EXTRACT(ISODOW FROM visit.createdAt)')
        .addGroupBy('EXTRACT(HOUR FROM visit.createdAt)')
        .getRawMany();

      const matrix: number[][] = days.map(() => new Array(10).fill(0));
      let maxCount = 0;
      let hasPeak = false;
      let peakDay = days[0];
      let peakHourLabel = hoursLabels[0];

      (rawMatrix || []).forEach((row) => {
        const dow = parseInt(row.dow, 10);
        const hour = parseInt(row.hour, 10);
        const count = parseInt(row.count, 10);

        const dayIdx = dow - 1;
        const hourIdx = hour - 8;

        if (dayIdx >= 0 && dayIdx < 7 && hourIdx >= 0 && hourIdx < 10) {
          matrix[dayIdx][hourIdx] = count;
          if (count > maxCount) {
            maxCount = count;
            hasPeak = true;
            peakDay = days[dayIdx];
            peakHourLabel = hoursLabels[hourIdx] || `${hour}:00`;
          }
        }
      });

      const weeklyData = days.map((day, idx) => ({
        day,
        hours: matrix[idx],
      }));

      const smartSuggestion = hasPeak
        ? { peakTime: `${peakDay}s around ${peakHourLabel}` }
        : null;

      return {
        hoursLabels,
        weeklyData,
        smartSuggestion,
      };
    } catch (error) {
      this.logger.error(
        '[AnalyticsService] Error in getPeakTimesAnalytics:',
        error,
      );
      throw new BadRequestException('Failed to fetch peak times analytics');
    }
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
