import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { User } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
    @InjectRepository(CampaignTemplate)
    private templateRepository: Repository<CampaignTemplate>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    private branchesService: BranchesService,
  ) {}

  async create(
    createCampaignDto: CreateCampaignDto,
    branchId: string,
  ): Promise<Campaign> {
    const branch = await this.branchesService.findById(branchId);
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      branchId,
      businessId: branch.businessId,
    } as Partial<Campaign>) as unknown as Campaign;

    (campaign as any).sent = 0;
    (campaign as any).delivered = '0%';
    (campaign as any).clicks = 0;

    return this.campaignRepository.save(campaign);
  }

  async findAll(
    branchId?: string,
    status?: CampaignStatus,
    businessId?: string,
  ): Promise<Campaign[]> {
    const where: any = {};
    if (branchId) where.branchId = branchId;
    else if (businessId) where.businessId = businessId;

    if (status) {
      where.status = status;
    }

    return this.campaignRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepository.remove(campaign);
  }

  // Template methods
  async createTemplate(
    createTemplateDto: CreateCampaignTemplateDto,
  ): Promise<CampaignTemplate> {
    const template = this.templateRepository.create(createTemplateDto as Partial<CampaignTemplate>);
    return this.templateRepository.save(template);
  }

  async findAllTemplates(): Promise<CampaignTemplate[]> {
    return this.templateRepository.find();
  }

  async findTemplate(id: string): Promise<CampaignTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }
}
