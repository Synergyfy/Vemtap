import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visit } from '../visitors/entities/visit.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Business } from '../businesses/entities/business.entity';
import { Device, DeviceStatus } from '../devices/entities/device.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  private async resolveBusinessContext(
    branchId: string | undefined,
    user: User,
  ) {
    console.log('[AnalyticsService] resolveBusinessContext input branchId:', branchId);
    const resolvedBranchId = branchId; 
    let businessId = user.businessId;

    if (!resolvedBranchId && !businessId && user.role === UserRole.OWNER) {
      const business = await this.businessRepository.findOne({
        where: { ownerId: user.id },
      });
      if (business) {
        businessId = business.id;
      }
    }

    console.log('[AnalyticsService] resolved context:', { resolvedBranchId, businessId });

    if (!resolvedBranchId && !businessId) {
      throw new BadRequestException('branchId or business context is required');
    }

    return { resolvedBranchId, businessId };
  }

  async getDashboardAnalytics(branchId: string | undefined, user: User) {
    const { resolvedBranchId, businessId } = await this.resolveBusinessContext(
      branchId,
      user,
    );
    console.log('[AnalyticsService] getDashboardAnalytics using branch:', resolvedBranchId, 'business:', businessId);
    
    const where: any = {};
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    } else {
      where.businessId = businessId;
    }

    const totalVisitsCount = await this.visitRepository.count({ where });

    // 1. Total Customers Count (Unique Users)
    const customerCountQb = this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.visits', 'visit')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (resolvedBranchId) {
      customerCountQb.andWhere('visit.branchId = :branchId', { branchId: resolvedBranchId });
    } else {
      customerCountQb.andWhere('visit.businessId = :businessId', { businessId });
    }
    const totalCustomersCount = await customerCountQb.select('COUNT(DISTINCT user.id)', 'count').getRawOne();
    const customersCount = parseInt(totalCustomersCount.count, 10) || 0;

    // 2. New Customers (Joined this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCustomersCount = await customerCountQb
      .clone()
      .andWhere('user.createdAt >= :startOfMonth', { startOfMonth })
      .getRawOne();
    const newCount = parseInt(newCustomersCount.count, 10) || 0;

    // 3. Repeat Rate
    const returningCount = await customerCountQb
      .clone()
      .groupBy('user.id')
      .having('COUNT(visit.id) > 1')
      .getCount();
    const repeatRate = customersCount > 0 ? Math.round((returningCount / customersCount) * 100) : 0;

    // 4. Peak Times (Today's Hourly Breakdown)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const peakTimesRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select("TO_CHAR(visit.createdAt, 'HH24')", 'hour')
      .addSelect('COUNT(visit.id)', 'count')
      .addSelect("COUNT(CASE WHEN visit.status = 'new' THEN 1 END)", 'newCount')
      .where('visit.createdAt >= :today', { today });

    if (resolvedBranchId) {
      peakTimesRaw.andWhere('visit.branchId = :branchId', { branchId: resolvedBranchId });
    } else {
      peakTimesRaw.andWhere('visit.businessId = :businessId', { businessId });
    }

    const peakTimesData = await peakTimesRaw
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const formattedPeakTimes = Array.from({ length: 24 }, (_, i) => {
      const hourStr = i.toString().padStart(2, '0');
      const match = peakTimesData.find(p => p.hour === hourStr);
      const label = i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i - 12}pm` : `${i}am`;
      return {
        hour: label,
        value: match ? parseInt(match.count, 10) : 0,
        new: match ? parseInt(match.newCount, 10) : 0
      };
    }).filter((_, i) => i >= 8 && i <= 22); // Focus on business hours 8am - 10pm

    return {
      stats: [
        {
          label: 'Total Visits',
          value: totalVisitsCount.toLocaleString(),
          trend: '+0%',
          isUp: true,
        },
        {
          label: 'New Customers',
          value: newCount.toLocaleString(),
          trend: '+0%',
          isUp: true,
        },
        { label: 'Avg. Stay Time', value: '45m', trend: '0%', isUp: true },
        { label: 'Repeat Rate', value: `${repeatRate}%`, trend: '0%', isUp: true },
      ],
      peakTimes: formattedPeakTimes,
      messagingRoi: [
        { label: 'Sent', value: '0' },
        { label: 'Delivered', value: '0', sub: '0%' },
        { label: 'Opened', value: '0', sub: '0%' },
        { label: 'Clicked', value: '0', sub: '0%' },
      ],
      engagementQuality: {
        surveyCompletion: '0%',
        reviewConversion: '0%',
        socialFollows: '0/day',
      },
      topPerformers: [],
    };
  }

  async getFootfallAnalytics(branchId: string | undefined, user: User) {
    const { resolvedBranchId, businessId } = await this.resolveBusinessContext(
      branchId,
      user,
    );
    const where: any = {};
    if (resolvedBranchId) {
      where.branchId = resolvedBranchId;
    } else {
      where.businessId = businessId;
    }

    const totalFootfall = await this.visitRepository.count({ where });

    const hourlyDataRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select("TO_CHAR(visit.createdAt, 'HH24')", 'hour')
      .addSelect('COUNT(visit.id)', 'count')
      .where(resolvedBranchId ? 'visit.branchId = :branchId' : 'visit.businessId = :businessId', 
             resolvedBranchId ? { branchId: resolvedBranchId } : { businessId });

    const hourlyData = await hourlyDataRaw
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const formattedHourly = Array.from({ length: 24 }, (_, i) => {
      const hourStr = i.toString().padStart(2, '0');
      const match = hourlyData.find(p => p.hour === hourStr);
      const label = i === 0 ? '12am' : i === 12 ? '12pm' : i > 12 ? `${i - 12}pm` : `${i}am`;
      return { hour: label, count: match ? parseInt(match.count, 10) : 0 };
    }).filter((_, i) => i >= 8 && i <= 23);

    return {
      stats: [
        { label: 'Total Footfall', value: totalFootfall.toLocaleString() },
        { label: 'Busiest Day', value: '...' },
        { label: 'Peak Hour', value: '...' },
        { label: 'Devices Active', value: '...' },
      ],
      hourlyData: formattedHourly,
      trafficByEntrance: [],
      visitDuration: {
        averageStay: '45 Minutes',
        trendText: '0%',
        distribution: [
          { label: 'Short', time: '< 15m', p: '20%' },
          { label: 'Medium', time: '15-60m', p: '60%' },
          { label: 'Long', time: '> 60m', p: '20%' },
        ],
      },
    };
  }

  async getPeakTimesAnalytics(branchId: string | undefined, user: User) {
    const { resolvedBranchId, businessId } = await this.resolveBusinessContext(
      branchId,
      user,
    );
    return {
      weeklyData: [
        { day: 'Monday', hours: [10, 15, 20, 25, 40, 50, 45, 30, 25, 20] },
        { day: 'Tuesday', hours: [12, 18, 25, 30, 45, 55, 50, 35, 30, 25] },
        { day: 'Wednesday', hours: [15, 22, 28, 35, 50, 60, 55, 40, 35, 30] },
        { day: 'Thursday', hours: [20, 30, 40, 50, 70, 85, 80, 60, 50, 40] },
        { day: 'Friday', hours: [30, 45, 60, 80, 100, 120, 110, 90, 80, 70] },
        {
          day: 'Saturday',
          hours: [40, 60, 80, 110, 140, 160, 150, 130, 110, 90],
        },
        {
          day: 'Sunday',
          hours: [35, 55, 75, 100, 130, 150, 140, 120, 100, 80],
        },
      ],
      hoursLabels: [
        '10am',
        '12pm',
        '2pm',
        '4pm',
        '6pm',
        '8pm',
        '10pm',
        '12am',
        '2am',
        '4am',
      ],
      smartSuggestion: {
        peakTime: 'Saturdays between 6pm - 8pm',
        recommendation:
          'Based on your peak times (Saturdays between 6pm - 8pm), we suggest adding **2 additional staff** members during this window to reduce wait times and improve customer satisfaction.',
      },
    };
  }

  // --- Admin Methods ---

  async getAdminSummary() {
    // 1. Platform Stats
    const totalBusinesses = await this.businessRepository.count();
    const totalVisits = await this.visitRepository.count();
    const totalCustomers = await this.userRepository.count({
      where: { role: UserRole.CUSTOMER },
    });
    const activeDevices = await this.deviceRepository.count({
      where: { status: DeviceStatus.ACTIVE },
    });

    // 2. Growth Trend (Last 12 Months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const growthTrendRaw = await this.visitRepository
      .createQueryBuilder('visit')
      .select("TO_CHAR(visit.createdAt, 'Mon')", 'month')
      .addSelect("TO_CHAR(visit.createdAt, 'YYYY-MM')", 'sortkey')
      .addSelect('COUNT(visit.id)', 'count')
      .where('visit.createdAt >= :date', { date: twelveMonthsAgo })
      .groupBy('sortkey')
      .addGroupBy('month')
      .orderBy('sortkey', 'ASC')
      .getRawMany();

    const monthlyData = growthTrendRaw.map((item) => ({
      month: item.month,
      value: parseInt(item.count, 10),
    }));

    // 3. Sector Split
    const sectorSplitRaw = await this.businessRepository
      .createQueryBuilder('business')
      .select('business.category', 'label')
      .addSelect('COUNT(business.id)', 'count')
      .groupBy('business.category')
      .getRawMany();

    const totalBizForSplit = sectorSplitRaw.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );
    const sectorSplit = sectorSplitRaw.map((item) => ({
      label: item.label || 'Other',
      value: totalBizForSplit
        ? Math.round((parseInt(item.count, 10) / totalBizForSplit) * 100)
        : 0,
    }));

    // 4. Security Alerts (Last 5 suspended or recent risks)
    const suspendedBusinesses = await this.businessRepository.find({
      where: { status: 'suspended' as any },
      take: 3,
      order: { updatedAt: 'DESC' },
    });

    const securityAlerts = suspendedBusinesses.map((biz) => ({
      msg: `Business ${biz.name} was suspended: ${biz.suspensionReason || 'No reason provided'}`,
      type: 'risk',
    }));

    return {
      stats: [
        {
          label: 'Total Businesses',
          value: totalBusinesses.toLocaleString(),
          change: 0,
          trend: 'up',
        },
        {
          label: 'Total Customers',
          value: totalCustomers.toLocaleString(),
          change: 0,
          trend: 'up',
        },
        {
          label: 'Total Platform Taps',
          value: totalVisits.toLocaleString(),
          change: 0,
          trend: 'up',
        },
        {
          label: 'Active Devices',
          value: activeDevices.toLocaleString(),
          change: 0,
          trend: 'up',
        },
      ],
      monthlyData,
      sectorSplit,
      securityAlerts,
    };
  }
}
