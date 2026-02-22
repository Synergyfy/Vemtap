import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageCampaign } from '../entities/message-campaign.entity';

@Injectable()
export class CampaignService {
    constructor(
        @InjectRepository(MessageCampaign)
        private readonly campaignRepo: Repository<MessageCampaign>,
    ) { }

    async createCampaign(data: Partial<MessageCampaign>): Promise<MessageCampaign> {
        const campaign = this.campaignRepo.create(data);
        return this.campaignRepo.save(campaign);
    }

    async getCampaigns(branchId: string): Promise<MessageCampaign[]> {
        return this.campaignRepo.find({
            where: { branchId },
            order: { createdAt: 'DESC' },
        });
    }

    async getCampaignById(id: string, branchId: string): Promise<MessageCampaign> {
        const campaign = await this.campaignRepo.findOne({ where: { id, branchId } });
        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }
        return campaign;
    }

    async updateCampaign(id: string, data: Partial<MessageCampaign>): Promise<MessageCampaign | null> {
        await this.campaignRepo.update(id, data);
        return this.campaignRepo.findOne({ where: { id } });
    }
}
