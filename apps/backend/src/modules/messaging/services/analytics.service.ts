import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageLog } from '../entities/message-log.entity';
import { MessageCampaign } from '../entities/message-campaign.entity';
import { Channel } from '../enums/channel.enum';
import { MessageStatus } from '../entities/message.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(MessageLog)
    private readonly logRepo: Repository<MessageLog>,
    @InjectRepository(MessageCampaign)
    private readonly campaignRepo: Repository<MessageCampaign>,
  ) {}

  async getDashboardMetrics(
    businessId: string,
    branchId?: string,
    channel?: Channel,
  ) {
    if (!businessId && !branchId) {
      throw new BadRequestException('businessId or branchId is required');
    }

    const query = this.logRepo.createQueryBuilder('log');

    if (branchId) {
      query.where('log.branchId = :branchId', { branchId });
    } else {
      query.where('log.businessId = :businessId', { businessId });
    }

    if (channel) {
      query.andWhere('log.channel = :channel', { channel });
    }

    const totalSent = await query
      .clone()
      .andWhere('log.direction = :direction', { direction: 'OUTBOUND' })
      .getCount();
    const totalDelivered = await query
      .clone()
      .andWhere('log.direction = :direction AND log.status = :status', {
        direction: 'OUTBOUND',
        status: MessageStatus.DELIVERED,
      })
      .getCount();

    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    const totalInbound = await query
      .clone()
      .andWhere('log.direction = :direction', { direction: 'INBOUND' })
      .getCount();

    // Traffic Trends (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendsRaw = await query
      .clone()
      .select("TO_CHAR(log.createdAt, 'Mon DD')", 'day')
      .addSelect("TO_CHAR(log.createdAt, 'YYYY-MM-DD')", 'sortkey')
      .addSelect("COUNT(CASE WHEN log.direction = 'OUTBOUND' THEN 1 END)", 'sent')
      .addSelect("COUNT(CASE WHEN log.status = :status THEN 1 END)", 'delivered')
      .setParameter('status', MessageStatus.DELIVERED)
      .andWhere('log.createdAt >= :date', { date: sevenDaysAgo })
      .groupBy('sortkey').addGroupBy('day')
      .orderBy('sortkey', 'ASC')
      .getRawMany();

    const trafficTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayLabel = d.toLocaleString('default', { month: 'short', day: '2-digit' });
      const match = trendsRaw.find(t => t.day === dayLabel);
      return {
        name: d.toLocaleString('default', { weekday: 'short' }),
        sent: match ? parseInt(match.sent, 10) : 0,
        delivered: match ? parseInt(match.delivered, 10) : 0,
      };
    });

    return {
      totalSent,
      totalDelivered,
      deliveryRate,
      repliesReceived: totalInbound,
      trafficTrend,
    };
  }
}
