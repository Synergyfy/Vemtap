import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  FinancialTransaction,
  FosTransactionType,
  FosPlatform,
} from '../fos-core/entities/financial-transaction.entity';
import { MetricsSnapshot } from '../fos-dashboard/entities/metrics-snapshot.entity';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { Plan } from '../subscriptions/entities/plan.entity';
import {
  RevenueTransactionsQueryDto,
  TransactionDto,
  TransactionsListResponseDto,
  RevenueAggregatesResponseDto,
  RevenueTrendDto,
  ChartDataQueryDto,
  MonthlyPlatformRevenueDto,
  RevenueByTypeDto,
  RevenueChartDataResponseDto,
  BusinessRevenueHistoryResponseDto,
  BusinessTransactionItemDto,
} from './dto/revenue-analytics.dto';

@Injectable()
export class FosRevenueAnalyticsService {
  private readonly logger = new Logger(FosRevenueAnalyticsService.name);

  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepo: Repository<FinancialTransaction>,
    @InjectRepository(MetricsSnapshot)
    private readonly snapshotRepo: Repository<MetricsSnapshot>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
  ) {}

  private toNumber(value: number | string): number {
    return Number(value) || 0;
  }

  // ────────────────────────────────────────────
  // 1. GET /revenue/transactions
  // ────────────────────────────────────────────

  async getTransactions(
    query: RevenueTransactionsQueryDto,
  ): Promise<TransactionsListResponseDto> {
    const {
      page = 1,
      perPage = 10,
      type,
      platform,
      businessId,
      agentId,
      startDate,
      endDate,
    } = query;

    const where: any = {};

    if (type) where.type = type;
    if (platform) where.platform = platform;
    if (businessId) where.businessId = businessId;
    if (agentId) where.agentId = agentId;

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.date = LessThanOrEqual(endDate);
    }

    const [transactions, total] = await this.transactionRepo.findAndCount({
      where,
      order: { date: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    const businessIds = [
      ...new Set(
        transactions.filter((t) => t.businessId).map((t) => t.businessId),
      ),
    ];
    const agentIds = [
      ...new Set(transactions.filter((t) => t.agentId).map((t) => t.agentId)),
    ];

    const [businesses, agents] = await Promise.all([
      businessIds.length > 0
        ? this.businessRepo.findByIds(businessIds)
        : Promise.resolve([] as Business[]),
      agentIds.length > 0
        ? this.userRepo.findByIds(agentIds)
        : Promise.resolve([] as User[]),
    ]);

    const businessMap = new Map(businesses.map((b) => [b.id, b.name]));
    const agentMap = new Map(
      agents.map((a) => [a.id, `${a.firstName} ${a.lastName}`]),
    );

    const transactionDtos: TransactionDto[] = transactions.map((t) => ({
      id: t.id,
      type: t.type,
      platform: t.platform,
      paymentMethod: t.paymentMethod ?? null,
      amount: this.toNumber(t.amount),
      cost: this.toNumber(t.cost),
      profit: this.toNumber(t.profit),
      referenceId: t.referenceId ?? null,
      date: t.date,
      businessId: t.businessId ?? null,
      businessName: t.businessId
        ? (businessMap.get(t.businessId) ?? null)
        : null,
      agentId: t.agentId ?? null,
      agentName: t.agentId ? (agentMap.get(t.agentId) ?? null) : null,
    }));

    return { transactions: transactionDtos, total };
  }

  // ────────────────────────────────────────────
  // 2. GET /revenue/aggregates
  // ────────────────────────────────────────────

  async getAggregates(): Promise<RevenueAggregatesResponseDto> {
    const [
      totalRevenueResult,
      subscriptionRevenueResult,
      smsRevenueResult,
      commissionRevenueResult,
      totalProfitResult,
      totalCount,
    ] = await Promise.all([
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .where('t.type = :type', { type: FosTransactionType.SUBSCRIPTION })
        .getRawOne<{ sum: string }>(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .where('t.type = :type', { type: FosTransactionType.SMS })
        .getRawOne<{ sum: string }>(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount), 0)', 'sum')
        .where('t.type = :type', { type: FosTransactionType.COMMISSION })
        .getRawOne<{ sum: string }>(),
      this.transactionRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.profit), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
      this.transactionRepo.count(),
    ]);

    return {
      totalRevenue: this.toNumber(totalRevenueResult?.sum ?? 0),
      subscriptionRevenue: this.toNumber(subscriptionRevenueResult?.sum ?? 0),
      smsRevenue: this.toNumber(smsRevenueResult?.sum ?? 0),
      totalProfit: this.toNumber(totalProfitResult?.sum ?? 0),
      agentPayouts: this.toNumber(commissionRevenueResult?.sum ?? 0),
      totalTransactions: totalCount,
    };
  }

  // ────────────────────────────────────────────
  // 3. GET /revenue/trends
  // ────────────────────────────────────────────

  async getTrends(
    startDate?: string,
    endDate?: string,
  ): Promise<RevenueTrendDto[]> {
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = Between(startDate, endDate);
    } else if (startDate) {
      dateFilter.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      dateFilter.date = LessThanOrEqual(endDate);
    }

    const snapshots = await this.snapshotRepo.find({
      where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      order: { date: 'ASC' },
    });

    if (snapshots.length >= 2) {
      return snapshots.map((s) => ({
        date: s.date,
        revenue: this.toNumber(s.totalRevenue),
        profit: this.toNumber(s.totalProfit),
      }));
    }

    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .select('t.date', 'date')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'revenue')
      .addSelect('COALESCE(SUM(t.profit), 0)', 'profit')
      .groupBy('t.date')
      .orderBy('t.date', 'ASC');

    if (startDate) {
      qb.andWhere('t.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('t.date <= :endDate', { endDate });
    }

    const rows = await qb.getRawMany<{
      date: string;
      revenue: string;
      profit: string;
    }>();

    return rows.map((r) => ({
      date: r.date,
      revenue: this.toNumber(r.revenue),
      profit: this.toNumber(r.profit),
    }));
  }

  // ────────────────────────────────────────────
  // 4. GET /revenue/chart-data
  // ────────────────────────────────────────────

  async getChartData(
    query: ChartDataQueryDto,
  ): Promise<RevenueChartDataResponseDto> {
    const { startDate, endDate, platform, type } = query;

    const monthlyQb = this.transactionRepo
      .createQueryBuilder('t')
      .select("TO_CHAR(t.date, 'Mon YY')", 'month')
      .addSelect("DATE_TRUNC('month', t.date)", 'month_sort')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'total')
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.platform = '${FosPlatform.VEMTAP}' THEN t.amount ELSE 0 END), 0)`,
        'vemtap',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN t.platform = '${FosPlatform.QRTHRIVE}' THEN t.amount ELSE 0 END), 0)`,
        'qrthrive',
      )
      .groupBy("TO_CHAR(t.date, 'Mon YY')")
      .addGroupBy("DATE_TRUNC('month', t.date)")
      .orderBy('month_sort', 'ASC');

    const typeQb = this.transactionRepo
      .createQueryBuilder('t')
      .select('t.type', 'name')
      .addSelect('COALESCE(SUM(t.amount), 0)', 'value')
      .groupBy('t.type');

    if (startDate) {
      monthlyQb.andWhere('t.date >= :startDate', { startDate });
      typeQb.andWhere('t.date >= :startDate', { startDate });
    }
    if (endDate) {
      monthlyQb.andWhere('t.date <= :endDate', { endDate });
      typeQb.andWhere('t.date <= :endDate', { endDate });
    }
    if (platform) {
      monthlyQb.andWhere('t.platform = :platform', { platform });
      typeQb.andWhere('t.platform = :platform', { platform });
    }
    if (type) {
      monthlyQb.andWhere('t.type = :type', { type });
      typeQb.andWhere('t.type = :type', { type });
    }

    const [monthlyRows, typeRows] = await Promise.all([
      monthlyQb.getRawMany<{
        month: string;
        total: string;
        vemtap: string;
        qrthrive: string;
      }>(),
      typeQb.getRawMany<{ name: string; value: string }>(),
    ]);

    const monthlyPlatformRevenue: MonthlyPlatformRevenueDto[] = monthlyRows.map(
      (r) => ({
        month: r.month,
        total: this.toNumber(r.total),
        vemtap: this.toNumber(r.vemtap),
        qrthrive: this.toNumber(r.qrthrive),
      }),
    );

    const revenueByType: RevenueByTypeDto[] = typeRows.map((r) => ({
      name: r.name,
      value: this.toNumber(r.value),
    }));

    return { monthlyPlatformRevenue, revenueByType };
  }

  // ────────────────────────────────────────────
  // 5. GET /revenue/business/:businessId/history
  // ────────────────────────────────────────────

  async getBusinessHistory(
    businessId: string,
  ): Promise<BusinessRevenueHistoryResponseDto> {
    const exists = await this.transactionRepo.findOne({
      where: { businessId },
      select: ['id'],
    });

    if (!exists) {
      throw new NotFoundException(
        `No transactions found for business ${businessId}`,
      );
    }

    const transactions = await this.transactionRepo.find({
      where: { businessId },
      order: { date: 'ASC' },
    });

    const items: BusinessTransactionItemDto[] = transactions.map((t) => ({
      id: t.id,
      date: t.date,
      amount: this.toNumber(t.amount),
      profit: this.toNumber(t.profit),
      type: t.type,
    }));

    return { transactions: items };
  }

  // ────────────────────────────────────────────
  // 6. GET /businesses/stats
  // ────────────────────────────────────────────

  async getBusinessStats(): Promise<{
    activeBusinesses: number;
    totalMrr: number;
    churnRate: number;
    churnedCount: number;
    totalBusinesses: number;
    bestSellingPlan: {
      plan: string;
      totalMrr: number;
      businessCount: number;
    } | null;
    planDistribution: {
      plan: string;
      count: number;
      totalMrr: number;
    }[];
    statusDistribution: {
      status: string;
      count: number;
    }[];
  }> {
    const [totalBusinesses, activeBusinesses, churnedCount, statusRaw] =
      await Promise.all([
        this.businessRepo.count(),
        this.businessRepo.count({ where: { status: 'active' as any } }),
        this.businessRepo.count({ where: { status: 'suspended' as any } }),
        this.businessRepo
          .createQueryBuilder('b')
          .select('b.status', 'status')
          .addSelect('COUNT(b.id)', 'count')
          .groupBy('b.status')
          .getRawMany<{ status: string; count: string }>(),
      ]);

    const statusDistribution = statusRaw.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));

    const churnRate =
      totalBusinesses > 0
        ? Math.round((churnedCount / totalBusinesses) * 1000) / 10
        : 0;

    const activeSubscriptions = await this.subscriptionRepo.find({
      where: { status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    const totalMrr = activeSubscriptions.reduce(
      (sum, sub) => sum + this.toNumber(sub.plan?.monthlyPrice ?? 0),
      0,
    );

    const planMap = new Map<string, { count: number; totalMrr: number }>();
    for (const sub of activeSubscriptions) {
      const planName = sub.plan?.name ?? 'UNKNOWN';
      const entry = planMap.get(planName) ?? { count: 0, totalMrr: 0 };
      entry.count += 1;
      entry.totalMrr += this.toNumber(sub.plan?.monthlyPrice ?? 0);
      planMap.set(planName, entry);
    }

    const planDistribution = Array.from(planMap.entries()).map(
      ([plan, data]) => ({
        plan,
        count: data.count,
        totalMrr: data.totalMrr,
      }),
    );

    let bestSellingPlan: {
      plan: string;
      totalMrr: number;
      businessCount: number;
    } | null = null;

    if (planDistribution.length > 0) {
      const sorted = [...planDistribution].sort(
        (a, b) => b.totalMrr - a.totalMrr,
      );
      bestSellingPlan = {
        plan: sorted[0].plan,
        totalMrr: sorted[0].totalMrr,
        businessCount: sorted[0].count,
      };
    }

    return {
      activeBusinesses,
      totalMrr,
      churnRate,
      churnedCount,
      totalBusinesses,
      bestSellingPlan,
      planDistribution,
      statusDistribution,
    };
  }
}
