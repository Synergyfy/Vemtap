import { Injectable } from '@nestjs/common';
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
    ) { }

    async getDashboardMetrics(businessId: string, channel?: Channel) {
        const query = this.logRepo.createQueryBuilder('log')
            .where('log.businessId = :businessId', { businessId });

        if (channel) {
            query.andWhere('log.channel = :channel', { channel });
        }

        const totalSent = await query.clone().andWhere('log.direction = :direction', { direction: 'OUTBOUND' }).getCount();
        const totalDelivered = await query.clone()
            .andWhere('log.direction = :direction AND log.status = :status', { direction: 'OUTBOUND', status: MessageStatus.DELIVERED })
            .getCount();

        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

        const totalInbound = await query.clone().andWhere('log.direction = :direction', { direction: 'INBOUND' }).getCount();

        return {
            totalSent,
            totalDelivered,
            deliveryRate,
            repliesReceived: totalInbound,
        };
    }
}
