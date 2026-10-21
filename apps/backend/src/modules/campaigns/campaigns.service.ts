import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { User, UserRole } from '../users/entities/user.entity';
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
    branchId: string | undefined,
    user: User,
  ): Promise<Campaign> {
    const targetBranchId =
      branchId || createCampaignDto.branchId || user.branchId;
    if (!targetBranchId) {
      throw new BadRequestException('branchId is required');
    }
    const branch = await this.ownBranch(targetBranchId, user.businessId);
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      branchId: branch.id,
      businessId: branch.businessId,
    } as Partial<Campaign>);

    (campaign as any).sent = 0;
    (campaign as any).delivered = '0%';
    (campaign as any).clicks = 0;

    return this.campaignRepository.save(campaign);
  }

  /**
   * Owners and managers only ever see their own business's campaigns, even
   * when they pass another business's branchId. Admins see every business.
   */
  async findAll(
    user: User,
    branchId?: string,
    status?: CampaignStatus,
  ): Promise<Campaign[]> {
    const where: FindOptionsWhere<Campaign> = {};
    if (user.role !== UserRole.ADMIN) {
      if (!user.businessId) return [];
      where.businessId = user.businessId;
    }
    if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    return this.campaignRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /** Another business's campaign reads as not found, so ids cannot be probed. */
  async findOne(id: string, businessId: string): Promise<Campaign> {
    const campaign = businessId
      ? await this.campaignRepository.findOne({ where: { id, businessId } })
      : null;
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    businessId: string,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, businessId);
    if (updateCampaignDto.branchId) {
      await this.ownBranch(updateCampaignDto.branchId, businessId);
    }
    Object.assign(campaign, updateCampaignDto);
    return this.campaignRepository.save(campaign);
  }

  async remove(id: string, businessId: string): Promise<void> {
    const campaign = await this.findOne(id, businessId);
    await this.campaignRepository.remove(campaign);
  }

  private async ownBranch(branchId: string, businessId: string) {
    const branch = await this.branchesService.findById(branchId);
    if (!businessId || branch.businessId !== businessId) {
      throw new ForbiddenException('Branch belongs to another business');
    }
    return branch;
  }

  // Template methods
  async createTemplate(
    createTemplateDto: CreateCampaignTemplateDto,
  ): Promise<CampaignTemplate> {
    const template = this.templateRepository.create(
      createTemplateDto as Partial<CampaignTemplate>,
    );
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
