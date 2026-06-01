import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingAnalytics } from '../entities/marketing-analytics.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(MarketingAnalytics)
    private readonly analyticsRepo: Repository<MarketingAnalytics>,
  ) {}

  async trackEvent(assetId: string, businessId: string, type: 'scan' | 'view'): Promise<MarketingAnalytics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Look for existing daily analytics record
    let record = await this.analyticsRepo.findOne({
      where: { assetId, date: today },
    });

    if (!record) {
      record = this.analyticsRepo.create({
        assetId,
        businessId,
        date: today,
        scansCount: 0,
        viewsCount: 0,
      });
    }

    if (type === 'scan') {
      record.scansCount += 1;
    } else {
      record.viewsCount += 1;
    }

    return this.analyticsRepo.save(record);
  }

  async getAssetPerformance(id: string, user: User, startDateStr?: string, endDateStr?: string) {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const start = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDateStr ? new Date(endDateStr) : new Date();

    const query = this.analyticsRepo.createQueryBuilder('analytics')
      .where('analytics.assetId = :id', { id })
      .andWhere('analytics.businessId = :businessId', { businessId })
      .andWhere('analytics.date >= :start', { start })
      .andWhere('analytics.date <= :end', { end })
      .orderBy('analytics.date', 'ASC');

    const dailyStats = await query.getMany();

    const totals = dailyStats.reduce(
      (acc, curr) => {
        acc.scans += curr.scansCount;
        acc.views += curr.viewsCount;
        return acc;
      },
      { scans: 0, views: 0 },
    );

    const conversionRate = totals.views > 0 ? parseFloat(((totals.scans / totals.views) * 100).toFixed(2)) : 0;

    return {
      assetId: id,
      totals: {
        scans: totals.scans,
        views: totals.views,
        conversionRate,
      },
      daily: dailyStats.map((d) => ({
        date: d.date,
        scans: d.scansCount,
        views: d.viewsCount,
      })),
    };
  }

  async getBusinessOverview(user: User) {
    const businessId = user.businessId || user.ownedBusiness?.id;
    if (!businessId) {
      throw new ForbiddenException('User is not associated with any business');
    }

    const days30Ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await this.analyticsRepo.createQueryBuilder('analytics')
      .where('analytics.businessId = :businessId', { businessId })
      .andWhere('analytics.date >= :days30Ago', { days30Ago })
      .getMany();

    const totals = analytics.reduce(
      (acc, curr) => {
        acc.scans += curr.scansCount;
        acc.views += curr.viewsCount;
        return acc;
      },
      { scans: 0, views: 0 },
    );

    const conversionRate = totals.views > 0 ? parseFloat(((totals.scans / totals.views) * 100).toFixed(2)) : 0;

    // Aggregate by template/asset type if needed, or by day
    const dailyMap: Record<string, { scans: number; views: number }> = {};
    analytics.forEach((d) => {
      const dateStr = d.date.toString();
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { scans: 0, views: 0 };
      }
      dailyMap[dateStr].scans += d.scansCount;
      dailyMap[dateStr].views += d.viewsCount;
    });

    const daily = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      scans: counts.scans,
      views: counts.views,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totals: {
        scans: totals.scans,
        views: totals.views,
        conversionRate,
      },
      daily,
    };
  }
}
