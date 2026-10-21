import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FindOptionsWhere, In, LessThanOrEqual, Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignTemplate } from './entities/campaign-template.entity';
import {
  CreateCampaignDto,
  CampaignStatus,
  CampaignType,
} from './dto/create-campaign.dto';
import { SendCampaignDto } from './dto/send-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CreateCampaignTemplateDto } from './dto/campaign-template.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { BranchesService } from '../branches/branches.service';
import { BusinessCustomersService } from '../business-customers/business-customers.service';
import { MessagingEngineService } from '../messaging/services/messaging-engine.service';
import { Channel } from '../messaging/enums/channel.enum';
import { AudienceType } from '../messaging/entities/message-campaign.entity';
import { ProviderRouterService } from '../messaging/services/provider-router.service';
import { CreditService } from '../messaging/services/credit.service';
import { ConfigService } from '@nestjs/config';
import { formatPhoneNumber } from '../../common/utils/phone.util';
import {
  CampaignStatsDto,
  CampaignTestResultDto,
} from './dto/campaign-stats.dto';

const CHANNEL: Record<CampaignType, Channel> = {
  [CampaignType.SMS]: Channel.SMS,
  [CampaignType.EMAIL]: Channel.EMAIL,
  [CampaignType.WHATSAPP]: Channel.WHATSAPP,
};

const SENDABLE = [
  CampaignStatus.DRAFT,
  CampaignStatus.SCHEDULED,
  CampaignStatus.RECURRING,
];

/** Scheduled campaigns dispatched per minute; the rest wait for the next tick. */
const DUE_BATCH = 20;

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

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
    private messagingEngine: MessagingEngineService,
    private moduleRef: ModuleRef,
    private providerRouter: ProviderRouterService,
    private creditService: CreditService,
    private config: ConfigService,
  ) {}

  /**
   * Resolved lazily: importing BusinessCustomersModule here closes a module
   * cycle (Messaging -> Loyalty -> ... -> Campaigns) that Nest cannot build.
   */
  private get businessCustomers(): BusinessCustomersService {
    return this.moduleRef.get(BusinessCustomersService, { strict: false });
  }

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

  /**
   * Sends a campaign through the messaging engine (credits, queue, providers)
   * to the given customers. Ids that are not this business's customers, or
   * that opted out of the channel, are dropped. A campaign scheduled for later
   * keeps its recipients and is sent by `dispatchDue` when it falls due.
   */
  async send(
    id: string,
    businessId: string,
    dto: SendCampaignDto,
  ): Promise<Campaign> {
    const campaign = await this.findOne(id, businessId);
    if (!SENDABLE.includes(campaign.status)) {
      throw new ConflictException('Campaign has already been sent');
    }
    const recipientIds = await this.reachable(
      businessId,
      dto.customerIds,
      CHANNEL[campaign.type],
    );
    if (!recipientIds.length) {
      throw new BadRequestException(
        'None of these customers can receive this campaign',
      );
    }
    if (dto.subject !== undefined) campaign.subject = dto.subject;

    if (campaign.scheduledFor && campaign.scheduledFor > new Date()) {
      await this.campaignRepository.update(id, {
        status: CampaignStatus.SCHEDULED,
        subject: campaign.subject,
        recipientIds,
      });
      return this.findOne(id, businessId);
    }

    await this.dispatch(campaign, recipientIds);
    return this.findOne(id, businessId);
  }

  /** Sends scheduled campaigns whose time has come. */
  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDue(): Promise<void> {
    const due = await this.campaignRepository
      .createQueryBuilder('c')
      .addSelect('c.recipientIds')
      .where({
        status: CampaignStatus.SCHEDULED,
        scheduledFor: LessThanOrEqual(new Date()),
      })
      .andWhere('c.recipientIds IS NOT NULL')
      .orderBy('c.scheduledFor', 'ASC')
      .take(DUE_BATCH)
      .getMany();

    // One send per due campaign, at most DUE_BATCH a tick; each send is a
    // bounded set of queries inside the messaging engine.
    for (const campaign of due) {
      try {
        await this.dispatch(campaign, campaign.recipientIds ?? []);
      } catch (error) {
        this.logger.error(
          `Scheduled campaign ${campaign.id} failed: ${(error as Error).message}`,
        );
        await this.campaignRepository.update(campaign.id, {
          status: CampaignStatus.DRAFT,
        });
      }
    }
  }

  /**
   * Claims the campaign (so two callers or two cron ticks cannot both send
   * it), hands it to the messaging engine, then records the count queued.
   */
  private async dispatch(
    campaign: Campaign,
    recipientIds: string[],
  ): Promise<void> {
    const claimed = await this.campaignRepository.update(
      { id: campaign.id, status: In(SENDABLE) },
      { status: CampaignStatus.ACTIVE },
    );
    if (!claimed.affected) {
      throw new ConflictException('Campaign has already been sent');
    }
    try {
      const result = await this.messagingEngine.sendMessage({
        branchId: campaign.branchId,
        businessId: campaign.businessId,
        channel: CHANNEL[campaign.type],
        customerIds: recipientIds,
        content: this.contentWithTrackedLink(campaign),
        // GROUP files every message under one engine campaign, even for a
        // single recipient, so delivery stats can be read back per campaign.
        audienceType: AudienceType.GROUP,
        metadata: {
          campaignId: campaign.id,
          subject: campaign.subject,
          senderName: campaign.senderName,
          replyTo: campaign.replyTo,
        },
      });
      await this.campaignRepository.update(campaign.id, {
        status: CampaignStatus.COMPLETED,
        sent: result.count,
        subject: campaign.subject,
        messageCampaignId: result.campaignId ?? null,
        recipientIds: null,
      });
    } catch (error) {
      await this.campaignRepository.update(campaign.id, {
        status: campaign.status,
      });
      throw error;
    }
  }

  /** Public URL that counts a click and redirects to the campaign's link. */
  private trackedLink(campaignId: string): string {
    const base = (
      this.config.get<string>('API_PUBLIC_URL') ??
      this.config.get<string>('APP_URL') ??
      ''
    ).replace(/\/+$/, '');
    return `${base}/api/v1/c/${campaignId}`;
  }

  /** The message with its link swapped for the tracked URL (appended when absent). */
  private contentWithTrackedLink(campaign: Campaign): string {
    if (!campaign.link) return campaign.message;
    const tracked = this.trackedLink(campaign.id);
    return campaign.message.includes(campaign.link)
      ? campaign.message.split(campaign.link).join(tracked)
      : `${campaign.message}\n${tracked}`;
  }

  /**
   * Delivery counts from the campaign's messages, grouped by status in one
   * query. Email has no delivery receipts, so an email the provider accepted
   * counts as delivered.
   */
  async stats(id: string, businessId: string): Promise<CampaignStatsDto> {
    const campaign = await this.findOne(id, businessId);
    const counts: Record<string, number> = {};
    if (campaign.messageCampaignId) {
      const rows: { status: string; count: string }[] =
        await this.campaignRepository.manager.query(
          `SELECT "status", COUNT(*)::int AS "count" FROM "messages"
           WHERE "campaignId" = $1 AND "deletedAt" IS NULL GROUP BY "status"`,
          [campaign.messageCampaignId],
        );
      for (const row of rows) counts[row.status] = Number(row.count);
    }
    const n = (status: string) => counts[status] ?? 0;
    const isEmail = campaign.type === CampaignType.EMAIL;
    const queued = n('PENDING') + n('QUEUED');
    const failed = n('FAILED') + n('REJECTED');
    const delivered = n('DELIVERED') + n('READ') + (isEmail ? n('SENT') : 0);
    const attempted = n('SENT') + n('DELIVERED') + n('READ') + failed;
    return {
      campaignId: campaign.id,
      status: campaign.status,
      recipients: campaign.sent,
      queued,
      sent: attempted - failed,
      delivered,
      read: n('READ'),
      failed,
      clicks: campaign.clicks,
      deliveredRate: attempted ? Math.round((delivered / attempted) * 100) : 0,
      clickRate: delivered
        ? Math.round((campaign.clicks / delivered) * 1000) / 10
        : 0,
    };
  }

  /**
   * Keeps the stored `delivered` rate of recently sent campaigns current, in
   * one statement: aggregate their messages and update every campaign at once.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshDeliveryRates(): Promise<void> {
    await this.campaignRepository.manager.query(
      `UPDATE "campaigns" c SET "delivered" = agg.rate || '%'
       FROM (
         SELECT c2."id",
           CASE WHEN COUNT(m."id") FILTER (WHERE m."status" NOT IN ('PENDING','QUEUED')) = 0 THEN 0
           ELSE ROUND(100.0 * COUNT(m."id") FILTER (
             WHERE m."status" IN ('DELIVERED','READ') OR (c2."type" = 'Email' AND m."status" = 'SENT')
           ) / COUNT(m."id") FILTER (WHERE m."status" NOT IN ('PENDING','QUEUED')))::int END AS rate
         FROM "campaigns" c2
         JOIN "messages" m ON m."campaignId" = c2."messageCampaignId" AND m."deletedAt" IS NULL
         WHERE c2."messageCampaignId" IS NOT NULL
           AND c2."updatedAt" > now() - interval '14 days'
         GROUP BY c2."id"
       ) agg
       WHERE c."id" = agg."id"`,
    );
  }

  /** Counts a click and returns where to send the visitor; `404` without a link. */
  async registerClick(id: string): Promise<string> {
    // Postgres UPDATE … RETURNING comes back from TypeORM as [rows, affected].
    const [rows]: [{ link: string }[], number] =
      await this.campaignRepository.manager.query(
        `UPDATE "campaigns" SET "clicks" = "clicks" + 1
         WHERE "id" = $1 AND "link" IS NOT NULL AND "deletedAt" IS NULL
         RETURNING "link"`,
        [id],
      );
    const link = rows[0]?.link;
    if (!link) throw new NotFoundException('Link not found');
    return link;
  }

  /**
   * Sends the campaign as-is to the caller's own email (Email) or phone (SMS),
   * for 1 credit, without touching its status. WhatsApp tests are not offered.
   */
  async sendTest(id: string, user: User): Promise<CampaignTestResultDto> {
    const campaign = await this.findOne(id, user.businessId);
    if (campaign.type === CampaignType.WHATSAPP) {
      throw new BadRequestException(
        'Test sends support SMS and email campaigns',
      );
    }
    const me = await this.userRepo.findOne({
      where: { id: user.id },
      select: ['id', 'email', 'phone'],
    });
    const isEmail = campaign.type === CampaignType.EMAIL;
    const to = isEmail ? me?.email : me?.phone && formatPhoneNumber(me.phone);
    if (!to) {
      throw new BadRequestException(
        isEmail
          ? 'Add an email to your profile to receive test emails'
          : 'Add a phone number to your profile to receive test SMS',
      );
    }
    const channel = CHANNEL[campaign.type];
    await this.creditService.deductCredits(
      campaign.businessId,
      channel,
      1,
      `Test send of campaign ${campaign.id}`,
    );
    const content = `[TEST] ${this.contentWithTrackedLink(campaign)}`;
    const result = await this.providerRouter.sendMessage({
      channel,
      to,
      content,
      from: isEmail ? undefined : 'VEMTAP',
      metadata: {
        subject: `[TEST] ${campaign.subject || campaign.name}`,
        senderName: campaign.senderName,
        replyTo: campaign.replyTo,
      },
    });
    return { to, channel: campaign.type, status: result.status };
  }

  /** Recipients that are the business's customers and accept the channel. */
  private async reachable(
    businessId: string,
    customerIds: string[],
    channel: Channel,
  ): Promise<string[]> {
    const known = await this.businessCustomers.filterKnownCustomers(
      businessId,
      [...new Set(customerIds)],
    );
    if (!known.length) return [];
    const users = await this.userRepo.find({
      where: { id: In(known), role: UserRole.CUSTOMER },
      select: ['id', 'optOut', 'optInChannels'],
    });
    return users
      .filter(
        (u) =>
          !u.optOut &&
          (!u.optInChannels?.length || u.optInChannels.includes(channel)),
      )
      .map((u) => u.id);
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
