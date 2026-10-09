import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { Device } from '../devices/entities/device.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Campaign } from '../campaigns/entities/campaign.entity';
import { Reward } from '../loyalty/entities/reward.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Business } from '../businesses/entities/business.entity';
import { CatalogueOffer } from '../catalogue/entities/catalogue-offer.entity';
import {
  CatalogueOfferClaim,
  CatalogueOfferClaimStatus,
} from '../catalogue/entities/catalogue-offer-claim.entity';
import { PosSale } from '../pos/entities/pos-sale.entity';
import { SaleStatus } from '../pos/entities/pos-enums';
import type {
  BusinessDashboardResponseDto,
  DashboardInsightDto,
  DashboardStatsDto,
  DashboardWeeklyDto,
} from './dto/business-dashboard.dto';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class BusinessDashboardService {
  private readonly logger = new Logger(BusinessDashboardService.name);

  constructor(
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(CatalogueOffer)
    private readonly offerRepo: Repository<CatalogueOffer>,
    @InjectRepository(CatalogueOfferClaim)
    private readonly claimRepo: Repository<CatalogueOfferClaim>,
    @InjectRepository(PosSale)
    private readonly posSaleRepo: Repository<PosSale>,
  ) {}

  async getDashboard(
    businessId: string,
    branchId?: string,
  ): Promise<BusinessDashboardResponseDto> {
    const stats = await this.computeStats(businessId, branchId);
    const weekly = await this.computeWeekly(businessId, branchId);
    const recentVisitors = await this.getRecentVisitors(businessId, branchId);
    const activityData = await this.getActivityData(businessId, branchId);
    const rewards = await this.getRewards(businessId);
    const notifications = await this.getNotifications(businessId);
    const messages = await this.getMessages(businessId);
    const staffMembers = await this.getStaff(businessId, branchId);
    const devices = await this.getDevices(businessId, branchId);
    const insights = this.computeInsights(stats, weekly, devices, messages);

    const business = await this.businessRepo.findOne({
      where: { id: businessId },
    });
    const businessName = business?.name || '';
    const businessLogo = business?.logoUrl || '';

    return {
      generatedAt: new Date().toISOString(),
      stats,
      weekly,
      insights,
      recentVisitors,
      activityData,
      rewards,
      notifications,
      messages,
      staffMembers,
      devices,
      businessName,
      businessLogo,
    };
  }

  private async computeStats(
    businessId: string,
    branchId?: string,
  ): Promise<DashboardStatsDto> {
    const where: any = branchId ? { branchId } : { businessId };

    const totalVisitors = await this.visitRepo.count({ where });
    const newVisitors = await this.visitRepo.count({
      where: { ...where, status: 'new' },
    });
    const repeatVisitors = await this.visitRepo.count({
      where: { ...where, status: 'returning' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysVisits = await this.visitRepo.count({
      where: { ...where, createdAt: Between(todayStart, new Date()) },
    });

    // Lifetime catalogue figures. `views` is a lifetime counter on the offer
    // (there is no view-event table), so it intentionally has no delta.
    const totalViewsRaw = await this.offerRepo
      .createQueryBuilder('offer')
      .select('COALESCE(SUM(offer.views), 0)', 'sum')
      .where(
        branchId
          ? 'offer.branchId = :branchId'
          : 'offer.businessId = :businessId',
        {
          branchId,
          businessId,
        },
      )
      .getRawOne();
    const totalViews = parseInt(totalViewsRaw?.sum || '0', 10);
    const totalClaims = await this.countClaims(businessId, branchId);

    // Deltas compare the last 7 days with the previous 7 days.
    const now = new Date();
    const weekStart = new Date(now.getTime() - WEEK_MS);
    const prevWeekStart = new Date(now.getTime() - 2 * WEEK_MS);

    const visitorsCurrent = await this.visitRepo.count({
      where: { ...where, createdAt: Between(weekStart, now) },
    });
    const visitorsPrevious = await this.visitRepo.count({
      where: { ...where, createdAt: Between(prevWeekStart, weekStart) },
    });
    const claimsCurrent = await this.countClaims(
      businessId,
      branchId,
      weekStart,
      now,
    );
    const claimsPrevious = await this.countClaims(
      businessId,
      branchId,
      prevWeekStart,
      weekStart,
    );
    const revenueCurrent = await this.sumPosRevenue(
      businessId,
      branchId,
      weekStart,
      now,
    );
    const revenuePrevious = await this.sumPosRevenue(
      businessId,
      branchId,
      prevWeekStart,
      weekStart,
    );

    return {
      totalVisitors,
      newVisitors,
      repeatVisitors,
      todaysVisits,
      totalViews,
      totalClaims,
      visitorsDelta: this.percentChange(visitorsCurrent, visitorsPrevious),
      claimsDelta: this.percentChange(claimsCurrent, claimsPrevious),
      revenueDelta: this.percentChange(revenueCurrent, revenuePrevious),
    };
  }

  private async computeWeekly(
    businessId: string,
    branchId?: string,
  ): Promise<DashboardWeeklyDto> {
    const now = new Date();
    const weekStart = new Date(now.getTime() - WEEK_MS);
    const where: any = branchId ? { branchId } : { businessId };

    const visits = await this.visitRepo.count({
      where: { ...where, createdAt: Between(weekStart, now) },
    });
    const claims = await this.countClaims(businessId, branchId, weekStart, now);
    const revenue = await this.sumPosRevenue(
      businessId,
      branchId,
      weekStart,
      now,
    );

    return { visits, claims, revenue };
  }

  private async countClaims(
    businessId: string,
    branchId?: string,
    from?: Date,
    to?: Date,
  ): Promise<number> {
    const qb = this.claimRepo
      .createQueryBuilder('claim')
      .innerJoin('claim.offer', 'offer')
      .where(
        branchId
          ? 'offer.branchId = :branchId'
          : 'offer.businessId = :businessId',
        { branchId, businessId },
      )
      .andWhere('claim.status IN (:...statuses)', {
        statuses: [
          CatalogueOfferClaimStatus.CLAIMED,
          CatalogueOfferClaimStatus.REDEEMED,
        ],
      });

    if (from && to) {
      qb.andWhere('claim.createdAt BETWEEN :from AND :to', { from, to });
    }

    return qb.getCount();
  }

  private async sumPosRevenue(
    businessId: string,
    branchId?: string,
    from?: Date,
    to?: Date,
  ): Promise<number> {
    const qb = this.posSaleRepo
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.total), 0)', 'sum')
      .where('sale.status = :status', { status: SaleStatus.COMPLETED })
      .andWhere(
        branchId
          ? 'sale.branchId = :branchId'
          : 'sale.businessId = :businessId',
        { branchId, businessId },
      );

    if (from && to) {
      qb.andWhere('sale.createdAt BETWEEN :from AND :to', { from, to });
    }

    const row = await qb.getRawOne();
    return Number(row?.sum || 0);
  }

  private percentChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  private computeInsights(
    stats: DashboardStatsDto,
    weekly: DashboardWeeklyDto,
    devices: { status?: string }[],
    messages: { status?: string }[],
  ): DashboardInsightDto[] {
    const insights: DashboardInsightDto[] = [];

    if (weekly.revenue > 0) {
      insights.push({
        id: 'revenue-momentum',
        title: 'POS momentum this week',
        message: `You took ₦${Math.round(weekly.revenue).toLocaleString()} in completed sales over the last 7 days.`,
        priority: 'medium',
      });
    }

    if (weekly.visits > 0 && stats.totalClaims === 0) {
      insights.push({
        id: 'convert-visitors',
        title: 'Turn visitors into claims',
        message:
          'You have visits but no deal claims yet — publish a promotion so visitors can claim a pass.',
        priority: 'high',
      });
    }

    if (stats.todaysVisits === 0) {
      insights.push({
        id: 'quiet-day',
        title: 'Quiet day so far',
        message:
          'No visits recorded today. Share your quick link or push a notification to bring people in.',
        priority: 'low',
      });
    }

    const onlineDevices = devices.filter(
      (device) => (device.status || '').toLowerCase() === 'active',
    ).length;
    if (devices.length === 0) {
      insights.push({
        id: 'add-device',
        title: 'Add an NFC device',
        message:
          'No devices are linked to this branch yet — add one to start tapping customers in.',
        priority: 'high',
      });
    } else if (onlineDevices === 0) {
      insights.push({
        id: 'devices-offline',
        title: 'Check your devices',
        message: 'None of your devices are currently active.',
        priority: 'medium',
      });
    }

    const scheduledMessages = messages.filter(
      (message) => (message.status || '').toLowerCase() === 'scheduled',
    ).length;
    if (scheduledMessages > 0) {
      insights.push({
        id: 'scheduled-campaigns',
        title: `${scheduledMessages} campaign${scheduledMessages > 1 ? 's' : ''} scheduled`,
        message:
          'Scheduled campaigns will send automatically — review their audience before they go out.',
        priority: 'low',
      });
    }

    return insights.slice(0, 4);
  }

  private async getRecentVisitors(businessId: string, branchId?: string) {
    const where: any = branchId ? { branchId } : { businessId };
    const visits = await this.visitRepo.find({
      where,
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return visits.map((v) => ({
      id: v.id,
      name: v.customer
        ? `${v.customer.firstName || ''} ${v.customer.lastName || ''}`.trim() ||
          v.customer.email
        : 'Unknown',
      phone: v.customer?.phone || '',
      email: v.customer?.email,
      time: this.timeAgo(v.createdAt),
      timestamp: v.createdAt.getTime(),
      status: v.status,
      branchId: v.branchId,
      location: '',
    }));
  }

  private async getActivityData(businessId: string, branchId?: string) {
    const where: any = branchId ? { branchId } : { businessId };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const visits = await this.visitRepo.find({
      where: { ...where, createdAt: Between(todayStart, new Date()) },
    });

    const hourBuckets: Record<string, number> = {};
    for (const v of visits) {
      const hour = v.createdAt.getHours();
      const label =
        hour === 0
          ? '12 AM'
          : hour < 12
            ? `${hour} AM`
            : hour === 12
              ? '12 PM'
              : `${hour - 12} PM`;
      hourBuckets[label] = (hourBuckets[label] || 0) + 1;
    }

    return Object.entries(hourBuckets).map(([hour, visits]) => ({
      hour,
      visits,
      branchId: branchId || undefined,
    }));
  }

  private async getRewards(businessId: string) {
    const rewards = await this.rewardRepo.find({
      where: { businessId },
      relations: ['branch'],
      take: 20,
    });

    return rewards.map((r) => ({
      id: r.id,
      title: r.name,
      points: r.pointsRequired,
      description: r.description,
      active: r.isActive,
      branchId: r.branch?.id,
    }));
  }

  private async getNotifications(businessId: string) {
    const users = await this.userRepo.find({
      where: { businessId },
      select: ['id'],
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length === 0) return [];

    const notifications = await this.notificationRepo.find({
      where: { userId: In(userIds) },
      order: { createdAt: 'DESC' as const },
      take: 20,
    });

    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: n.createdAt.getTime(),
      read: n.isRead,
      type: n.type,
      scope: 'DASHBOARD',
    }));
  }

  private async getMessages(businessId: string) {
    const campaigns = await this.campaignRepo.find({
      where: { businessId },
      order: { createdAt: 'DESC' as const },
      take: 10,
    });

    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      audience: c.audience,
      status: c.status,
      sent: c.sent,
      delivered: c.delivered,
      deliveryRate: c.sent ? Math.round((c.clicks / c.sent) * 100) : 0,
      clicks: c.clicks,
      opens: 0,
      ctr: c.sent ? Math.round((c.clicks / c.sent) * 10000) / 100 : 0,
      timestamp: c.createdAt.getTime(),
      branchId: c.branchId,
    }));
  }

  private async getStaff(businessId: string, branchId?: string) {
    const where: any = { businessId };
    if (branchId) {
      where.branchId = branchId;
    }

    const staff = await this.userRepo.find({
      where,
      relations: ['branch'],
      take: 50,
    });

    return staff.map((s) => ({
      id: s.id,
      name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email,
      email: s.email,
      role: s.role,
      status: s.status,
      lastActive: s.lastActive ? this.timeAgo(s.lastActive) : 'Never',
      branchId: s.branchId,
    }));
  }

  private async getDevices(businessId: string, branchId?: string) {
    let deviceWhere: any;
    if (branchId) {
      deviceWhere = { branchId };
    } else {
      const branches = await this.branchRepo.find({
        where: { businessId },
        select: ['id'],
      });
      const branchIds = branches.map((b) => b.id);
      if (branchIds.length === 0) return [];
      deviceWhere = { branchId: In(branchIds) };
    }
    const devices = await this.deviceRepo.find({
      where: deviceWhere,
      relations: ['branch'],
      take: 50,
    });

    return devices.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      code: d.code,
      location: d.location || '',
      assignedTo: d.branch?.name,
      lastActive: d.lastActive ? this.timeAgo(d.lastActive) : 'Never',
      status: d.status,
      batteryLevel: d.batteryLevel,
      totalScans: d.totalScans,
      branchId: d.branchId,
    }));
  }

  private timeAgo(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }
}
