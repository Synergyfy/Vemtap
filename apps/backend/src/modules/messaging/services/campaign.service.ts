import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageCampaign } from '../entities/message-campaign.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(MessageCampaign)
    private readonly campaignRepo: Repository<MessageCampaign>,
  ) {}

  async createCampaign(
    data: Partial<MessageCampaign>,
  ): Promise<MessageCampaign> {
    const campaign = this.campaignRepo.create(data);
    return this.campaignRepo.save(campaign);
  }

  async getCampaigns(
    branchId?: string,
    businessId?: string,
  ): Promise<MessageCampaign[]> {
    const where: any = {};
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (businessId) where.businessId = businessId;

    return this.campaignRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getCampaignById(
    id: string,
    branchId?: string,
    businessId?: string,
  ): Promise<MessageCampaign> {
    const where: any = { id };
    if (branchId && branchId !== 'all') where.branchId = branchId;
    if (businessId) where.businessId = businessId;

    const campaign = await this.campaignRepo.findOne({
      where,
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    return campaign;
  }

  async updateCampaign(
    id: string,
    data: Partial<MessageCampaign>,
  ): Promise<MessageCampaign | null> {
    await this.campaignRepo.update(id, data);
    return this.campaignRepo.findOne({ where: { id } });
  }
}
