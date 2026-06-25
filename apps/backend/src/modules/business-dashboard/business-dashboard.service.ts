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
import type {
  BusinessDashboardResponseDto,
  DashboardStatsDto,
} from './dto/business-dashboard.dto';

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
  ) {}

  async getDashboard(
    businessId: string,
    branchId?: string,
  ): Promise<BusinessDashboardResponseDto> {
    const stats = await this.computeStats(businessId, branchId);
    const recentVisitors = await this.getRecentVisitors(businessId, branchId);
    const activityData = await this.getActivityData(businessId, branchId);
    const rewards = await this.getRewards(businessId);
    const notifications = await this.getNotifications(businessId);
    const messages = await this.getMessages(businessId);
    const staffMembers = await this.getStaff(businessId, branchId);
    const devices = await this.getDevices(businessId, branchId);

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    const businessName = business?.name || '';
    const businessLogo = business?.logoUrl || '';

    return {
      stats,
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
    const newVisitors = await this.visitRepo.count({ where: { ...where, status: 'new' } });
    const repeatVisitors = await this.visitRepo.count({ where: { ...where, status: 'returning' } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaysVisits = await this.visitRepo.count({
      where: { ...where, createdAt: Between(todayStart, new Date()) },
    });

    return { totalVisitors, newVisitors, repeatVisitors, todaysVisits };
  }

  private async getRecentVisitors(
    businessId: string,
    branchId?: string,
  ) {
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
        ? `${v.customer.firstName || ''} ${v.customer.lastName || ''}`.trim() || v.customer.email
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

  private async getActivityData(
    businessId: string,
    branchId?: string,
  ) {
    const where: any = branchId ? { branchId } : { businessId };
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const visits = await this.visitRepo.find({
      where: { ...where, createdAt: Between(todayStart, new Date()) },
    });

    const hourBuckets: Record<string, number> = {};
    for (const v of visits) {
      const hour = v.createdAt.getHours();
      const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
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
      deliveryRate: c.sent ? Math.round(c.clicks / c.sent * 100) : 0,
      clicks: c.clicks,
      opens: 0,
      ctr: c.sent ? Math.round(c.clicks / c.sent * 10000) / 100 : 0,
      timestamp: c.createdAt.getTime(),
      branchId: c.branchId,
    }));
  }

  private async getStaff(
    businessId: string,
    branchId?: string,
  ) {
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

  private async getDevices(
    businessId: string,
    branchId?: string,
  ) {
    let deviceWhere: any;
    if (branchId) {
      deviceWhere = { branchId };
    } else {
      const branches = await this.branchRepo.find({ where: { businessId }, select: ['id'] });
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
