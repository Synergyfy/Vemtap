import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Message } from '../entities/message.entity';
import { MessageDirection, MessageStatus } from '../enums/message.enum';
import { MessageLog } from '../entities/message-log.entity';
import { ConversationThread } from '../entities/conversation-thread.entity';
import { Channel } from '../enums/channel.enum';
import { SendMessageDto } from '../dto/send-message.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ComplianceService } from './compliance.service';
import { CreditService } from './credit.service';
import { TemplateService } from './template.service';
import { CampaignService } from './campaign.service';
import { SettingsService } from '../../settings/settings.service';
import { ProviderRouterService } from './provider-router.service';
import { BranchesService } from '../../branches/branches.service';
import { Branch } from '../../branches/entities/branch.entity';
import { AudienceType } from '../entities/message-campaign.entity';
import {
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { formatPhoneNumber } from '../../../common/utils/phone.util';
import { MessagingGateway } from '../messaging.gateway';
import { ThreadStatus } from '../entities/conversation-thread.entity';
import { PushNotificationService } from '../../notifications/push-notification.service';
import { Visit } from '../../visitors/entities/visit.entity';
import { LoyaltyService } from '../../loyalty/loyalty.service';
import { Segment } from '../../contacts/entities/segment.entity';

export interface SendMessageResult {
  message: string;
  count: number;
  messageIds: string[];
  campaignId?: string;
  totalCost?: number;
  totalUnits?: number;
  status?: string;
}

@Injectable()
export class MessagingEngineService {
  private readonly logger = new Logger(MessagingEngineService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageLog)
    private readonly logRepo: Repository<MessageLog>,
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(Visit)
    private readonly visitRepo: Repository<Visit>,
    @InjectQueue('messaging-batch-send') private readonly batchQueue: Queue,
    @InjectQueue('messaging-individual-send')
    private readonly individualQueue: Queue,
    private readonly complianceService: ComplianceService,
    private readonly creditService: CreditService,
    private readonly templateService: TemplateService,
    private readonly campaignService: CampaignService,
    private readonly settingsService: SettingsService,
    private readonly providerRouter: ProviderRouterService,
    private readonly branchesService: BranchesService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly messagingGateway: MessagingGateway,
    private readonly pushNotificationService: PushNotificationService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  public async checkBranchAccess(
    user: User,
    branchId: string,
  ): Promise<boolean> {
    return this.branchesService.checkBranchAccess(user, branchId);
  }

  public async sendMessage(dto: SendMessageDto): Promise<SendMessageResult> {
    const {
      branchId,
      businessId,
      customerIds,
      content,
      channel,
      templateId,
      audienceType,
    } = dto;

    const branch = await this.branchRepo.findOne({
      where: { id: branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const effectiveBusinessId = businessId || branch.businessId;

    // 1. Resolve Target Users (Customers)
    let targetUserIds: string[] = customerIds || [];

    if (audienceType === AudienceType.ALL) {
      // Find all users who have visited this branch
      const visits = await this.visitRepo.find({
        where: { branchId },
        select: ['customerId'],
      });
      targetUserIds = [...new Set(visits.map((v) => v.customerId))];
    } else if (audienceType === AudienceType.RECENT) {
      // Last 30 days visits
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentVisits = await this.visitRepo
        .createQueryBuilder('visit')
        .where('visit.branchId = :branchId', { branchId })
        .andWhere('visit.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .select(['visit.customerId'])
        .getMany();
      targetUserIds = [...new Set(recentVisits.map((v) => v.customerId))];
    } else if (audienceType === AudienceType.SEGMENT && dto.segmentId) {
      const segment = await this.dataSource.getRepository(Segment).findOne({
        where: { id: dto.segmentId, branchId },
        relations: ['users'],
      });
      if (!segment)
        throw new NotFoundException(
          'Segment not found or does not belong to this branch',
        );
      targetUserIds = segment.users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      throw new BadRequestException('No customers found for selected audience');
    }

    // 2. Validate Credits
    const wallet =
      await this.creditService.getOrCreateWallet(effectiveBusinessId);
    let balance = 0;
    if (channel === Channel.SMS) balance = wallet.smsCredits;
    else if (channel === Channel.EMAIL) balance = wallet.emailCredits;
    else if (channel === Channel.WHATSAPP) balance = wallet.whatsappCredits;
    else if (channel === Channel.IN_HOUSE) balance = 999999; // In-app is free

    // 4. Resolve Content (if template)
    let baseContent = content || '';
    if (templateId) {
      const template = await this.templateService.findOne(templateId);
      baseContent = template.content;
    }

    // 3. Resolve actual user records
    const validUsers = await this.userRepo.find({
      where: {
        id: In(targetUserIds),
        role: UserRole.CUSTOMER,
      },
    });

    if (validUsers.length === 0) {
      return {
        message: 'No valid customers to send to',
        count: 0,
        messageIds: [],
      };
    }

    let totalCreditsNeeded = 0;
    if (channel === Channel.SMS) {
      for (const customer of validUsers) {
        const resolved = await this.resolvePlaceholdersSync(
          baseContent,
          customer,
          branch,
        );
        totalCreditsNeeded += resolved.length > 160 ? 2 : 1;
      }
    } else if (channel === Channel.IN_HOUSE) {
      totalCreditsNeeded = 0;
    } else {
      totalCreditsNeeded = validUsers.length;
    }

    if (balance < totalCreditsNeeded) {
      throw new BadRequestException(
        `Insufficient ${channel} credits. Need ${totalCreditsNeeded}, but you only have ${balance}. Please top up.`,
      );
    }

    // Deduct credits upfront to prevent race conditions
    if (totalCreditsNeeded > 0 && channel !== Channel.IN_HOUSE) {
      await this.creditService.deductCredits(
        effectiveBusinessId,
        channel,
        totalCreditsNeeded,
        `Campaign/Message for ${validUsers.length} recipients`,
      );
    }

    const validUserIds = validUsers.map((u) => u.id);

    // 5. Determine "From" number/id
    let from = dto.from || '';
    if (channel === Channel.SMS && !from) {
      from = 'VEMTAP'; // Use default sender ID for all businesses for now
    }

    if (channel === Channel.WHATSAPP && !from) {
      from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

      if (!from) {
        from =
          branch.whatsappNumber ||
          (branch.business as any)?.whatsappNumber ||
          '';
        if (!from) {
          const settings = await this.settingsService.getSettings();
          from = (settings as any).whatsappNumber;
        }
      }
      from = formatPhoneNumber(from);
    }

    // 6. Create Campaign Record if more than one recipient
    let campaignId: string | undefined;
    if (validUserIds.length > 1 || audienceType) {
      const campaign = await this.campaignService.createCampaign({
        name: `Campaign ${new Date().toISOString()}`,
        branchId,
        businessId: effectiveBusinessId,
        channel,
        audienceType: audienceType || AudienceType.ALL,
        audienceSize: validUserIds.length,
        content: baseContent,
        templateId,
      });
      campaignId = campaign.id;
    }

    // 7. Batch (> 50)
    if (validUserIds.length > 50) {
      await this.batchQueue.add('send-batch', {
        ...dto,
        campaignId,
        customerIds: validUserIds,
        content: baseContent,
        from,
      });
      return {
        message: 'Batch campaign queued',
        status: 'QUEUED',
        campaignId,
        count: validUserIds.length,
        messageIds: [],
      };
    }

    // 8. Individual (<= 50): Create records and queue sending
    const messageIds: string[] = [];
    const jobs: any[] = [];

    for (let i = 0; i < validUsers.length; i++) {
      const customer = validUsers[i];
      const resolvedContent = await this.resolvePlaceholders(
        baseContent,
        customer.id,
        branch,
      );

      // Find or create conversation thread
      let thread = await this.threadRepo.findOne({
        where: { branchId: branch.id, customerId: customer.id, channel },
      });

      if (!thread) {
        thread = this.threadRepo.create({
          branchId: branch.id,
          businessId: branch.businessId,
          customerId: customer.id,
          channel,
          status: ThreadStatus.OPEN,
        } as any) as unknown as ConversationThread;
        await this.threadRepo.save(thread);
      }

      const message = this.messageRepo.create({
        branchId: branch.id,
        businessId: branch.businessId,
        customerId: customer.id,
        threadId: thread.id,
        campaignId,
        content: resolvedContent,
        channel,
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.PENDING,
        from,
        to:
          channel === Channel.EMAIL
            ? customer.email || ''
            : formatPhoneNumber(customer.phone || ''),
        timestamp: new Date(),
        metadata: dto.metadata || {},
      } as any) as unknown as Message;

      const savedMessage = await this.messageRepo.save(message);
      messageIds.push(savedMessage.id);

      jobs.push({
        name: 'send-individual',
        data: {
          branchId,
          customerId: customer.id,
          content: resolvedContent,
          channel,
          from,
          campaignId,
          messageId: savedMessage.id,
        },
        opts: {
          delay: i * 500, // 0.5s stagger between messages
        },
      });
    }

    await this.individualQueue.addBulk(jobs);

    return {
      message: 'Messages queued for delivery',
      status: 'QUEUED',
      count: messageIds.length,
      messageIds,
      campaignId,
    };
  }

  private resolvePlaceholdersSync(
    content: string,
    customer: User,
    branch: Branch,
  ): string {
    if (!content) return '';

    let resolved = content;

    // --- Customer Placeholders ---
    const fullName =
      `${customer.firstName} ${customer.lastName}`.trim() || 'Customer';
    const firstName = customer.firstName || 'Customer';
    const lastName = customer.lastName || '';

    resolved = resolved.replace(/{Name}/g, fullName);
    resolved = resolved.replace(/{FirstName}/g, firstName);
    resolved = resolved.replace(/{LastName}/g, lastName || '');
    resolved = resolved.replace(/{Email}/g, customer.email || '');
    resolved = resolved.replace(
      /{Phone}/g,
      formatPhoneNumber(customer.phone || ''),
    );

    // --- Business/Branch Placeholders ---
    const bizName = branch.business?.name || branch.name || 'Our Business';
    resolved = resolved.replace(/{BusinessName}/g, bizName);
    resolved = resolved.replace(/{BranchName}/g, branch.name || '');
    resolved = resolved.replace(/{BranchAddress}/g, branch.address || '');
    resolved = resolved.replace(/{BranchCity}/g, branch.city || '');
    resolved = resolved.replace(
      /{BranchPhone}/g,
      formatPhoneNumber(branch.phone || ''),
    );
    resolved = resolved.replace(/{Website}/g, branch.website || '');
    resolved = resolved.replace(/{ReviewLink}/g, branch.reviewUrl || '');
    resolved = resolved.replace(
      /{Link}/g,
      branch.website || branch.reviewUrl || '',
    );

    resolved = resolved.replace(/{Points}/g, '9999');

    return resolved;
  }

  private async sendIndividualMessage(
    branch: Branch,
    customerId: string,
    content: string,
    channel: Channel,
    from: string,
    campaignId?: string,
    metadata?: any,
    messageId?: string,
  ): Promise<Message> {
    const customer = await this.userRepo.findOneBy({ id: customerId });
    if (!customer) throw new NotFoundException('Customer not found');

    // If messageId is provided, we are in a background worker processing an existing message
    let savedMessage: Message;
    let resolvedContent: string;

    if (messageId) {
      const existing = await this.messageRepo.findOneBy({ id: messageId });
      if (!existing) throw new NotFoundException('Message not found');
      savedMessage = existing;
      resolvedContent = savedMessage.content;
    } else {
      resolvedContent = await this.resolvePlaceholders(
        content,
        customerId,
        branch,
      );

      // Find or create conversation thread
      let thread = await this.threadRepo.findOne({
        where: {
          branchId: branch.id,
          customerId,
          channel,
        },
      });

      if (!thread) {
        thread = this.threadRepo.create({
          branchId: branch.id,
          businessId: branch.businessId,
          customerId,
          channel,
          status: ThreadStatus.OPEN,
        } as any) as unknown as ConversationThread;
        await this.threadRepo.save(thread);
      }

      const message = this.messageRepo.create({
        branchId: branch.id,
        businessId: branch.businessId,
        customerId,
        threadId: thread.id,
        campaignId,
        content: resolvedContent,
        channel,
        direction: MessageDirection.OUTBOUND,
        status:
          channel === Channel.IN_HOUSE
            ? MessageStatus.DELIVERED
            : MessageStatus.PENDING,
        from,
        to:
          channel === Channel.EMAIL
            ? customer.email || ''
            : formatPhoneNumber(customer.phone || ''),
        timestamp: new Date(),
        metadata: metadata || {},
      } as any) as unknown as Message;

      const savedResult = await this.messageRepo.save(message);
      savedMessage = (
        Array.isArray(savedResult) ? savedResult[0] : savedResult
      ) as Message;

      // Update thread metadata
      this.threadRepo
        .update(thread.id, {
          lastActivityAt: new Date(),
          lastMessageContent: content,
          status: ThreadStatus.OPEN,
        })
        .catch((e) => this.logger.error(`Thread update failed: ${e.message}`));
    }

    // --- Delivery Logic ---
    if (channel === Channel.IN_HOUSE) {
      // For chat, emit immediately
      this.messagingGateway.emitMessage(
        savedMessage.threadId,
        branch.id,
        customerId,
        savedMessage,
      );

      this.pushNotificationService
        .sendNotification(
          customerId,
          `New Message from ${branch.business?.name || branch.name}`,
          resolvedContent,
          { threadId: savedMessage.threadId, channel: Channel.IN_HOUSE },
          true,
        )
        .catch((e) =>
          this.logger.error(`Push notification failed: ${e.message}`),
        );
    } else {
      // Actually call the provider
      try {
        const providerResult = await this.providerRouter.sendMessage({
          channel,
          to: savedMessage.to,
          content: savedMessage.content,
          from,
          metadata: { messageId: savedMessage.id },
        });

        savedMessage.status = this.mapProviderStatus(providerResult.status);
        savedMessage.providerMessageId = providerResult.messageId || '';
        savedMessage.cost = providerResult.cost;
        savedMessage.units = providerResult.units;
        savedMessage.reference = providerResult.reference;
        await this.messageRepo.save(savedMessage);

        if (
          savedMessage.status === MessageStatus.SENT ||
          savedMessage.status === MessageStatus.DELIVERED ||
          savedMessage.status === MessageStatus.PENDING
        ) {
          this.logger.log(
            `✅ SUCCESS: [${channel}] delivery status: ${savedMessage.status}`,
          );
        }
      } catch (err: any) {
        this.logger.error(`❌ ERROR: Delivery failed: ${err.message}`);
        savedMessage.status = MessageStatus.FAILED;
        await this.messageRepo.save(savedMessage);
        throw err; // Throw to allow BullMQ to retry if this was called from a processor
      }
    }

    if (!messageId) {
      this.logMessage(savedMessage).catch((e) =>
        this.logger.error(`Logging failed: ${e.message}`),
      );
    }

    return savedMessage;
  }

  public async resolvePlaceholders(
    content: string,
    customerId: string,
    branch: Branch,
  ): Promise<string> {
    if (!content) return '';

    const customer = await this.userRepo.findOneBy({ id: customerId });
    if (!customer) return content;

    let resolved = content;

    // --- Customer Placeholders ---
    const fullName =
      `${customer.firstName} ${customer.lastName}`.trim() || 'Customer';
    const firstName = customer.firstName || 'Customer';
    const lastName = customer.lastName || '';

    resolved = resolved.replace(/{Name}/g, fullName);
    resolved = resolved.replace(/{FirstName}/g, firstName);
    resolved = resolved.replace(/{LastName}/g, lastName || '');
    resolved = resolved.replace(/{Email}/g, customer.email || '');
    resolved = resolved.replace(
      /{Phone}/g,
      formatPhoneNumber(customer.phone || ''),
    );

    // --- Business/Branch Placeholders ---
    const bizName = branch.business?.name || branch.name || 'Our Business';
    resolved = resolved.replace(/{BusinessName}/g, bizName);
    resolved = resolved.replace(/{BranchName}/g, branch.name || '');
    resolved = resolved.replace(/{BranchAddress}/g, branch.address || '');
    resolved = resolved.replace(/{BranchCity}/g, branch.city || '');
    resolved = resolved.replace(
      /{BranchPhone}/g,
      formatPhoneNumber(branch.phone || ''),
    );
    resolved = resolved.replace(/{Website}/g, branch.website || '');
    resolved = resolved.replace(/{ReviewLink}/g, branch.reviewUrl || '');
    resolved = resolved.replace(
      /{Link}/g,
      branch.website || branch.reviewUrl || '',
    );

    try {
      const points = await this.loyaltyService.getBusinessPoints(
        customer.id,
        branch.businessId,
      );
      resolved = resolved.replace(/{Points}/g, points.toString());
    } catch (e) {
      resolved = resolved.replace(/{Points}/g, '0');
    }

    return resolved;
  }

  /**
   * Checks if a string contains any personalization placeholders like {Name}, {FirstName}, etc.
   */
  public hasPlaceholders(content: string): boolean {
    if (!content) return false;
    const placeholderRegex = /{[a-zA-Z0-9]+}/;
    return placeholderRegex.test(content);
  }

  private mapProviderStatus(status: string): MessageStatus {
    switch (status) {
      case 'queued':
        return MessageStatus.PENDING;
      case 'sent':
        return MessageStatus.SENT;
      case 'failed':
        return MessageStatus.FAILED;
      default:
        return MessageStatus.SENT;
    }
  }

  private async logMessage(msg: Message) {
    const log = this.logRepo.create({
      branchId: msg.branchId,
      businessId: (msg as any).businessId,
      messageId: msg.id,
      customerId: msg.customerId,
      channel: msg.channel,
      direction: msg.direction,
      status: msg.status,
      timestamp: new Date(),
    } as any) as unknown as MessageLog;
    await this.logRepo.save(log);
  }

  async updateDeliveryStatus(
    messageId: string,
    status: MessageStatus,
    error?: string,
  ) {
    await this.messageRepo.update(messageId, { status });
    await this.logRepo.update({ messageId }, { status, errorReason: error });
  }

  async getOrCreateThread(
    branchId: string,
    customerId: string,
    channel: Channel,
  ): Promise<ConversationThread> {
    let thread = await this.threadRepo.findOne({
      where: { branchId, customerId, channel },
    });

    if (!thread) {
      const branch = await this.branchRepo.findOneBy({ id: branchId });
      thread = this.threadRepo.create({
        branchId,
        businessId: branch?.businessId,
        customerId,
        channel,
        status: ThreadStatus.OPEN,
      } as any) as unknown as ConversationThread;
      await this.threadRepo.save(thread);
    }
    return thread;
  }

  async createMessage(data: any): Promise<Message> {
    const message = this.messageRepo.create({
      ...data,
      status:
        data.channel === Channel.IN_HOUSE
          ? MessageStatus.DELIVERED
          : MessageStatus.PENDING,
      timestamp: new Date(),
    }) as unknown as Message;
    return this.messageRepo.save(message);
  }

  async queueIndividualSend(data: {
    branchId: string;
    customerId: string;
    content: string;
    channel: Channel;
    from: string;
    campaignId?: string;
    messageId: string;
    delay?: number;
  }) {
    return this.individualQueue.add('send-individual', data, {
      delay: data.delay || 0,
    });
  }

  async processSingleSend(
    branchId: string,
    customerId: string,
    content: string,
    channel: Channel,
    from: string,
    campaignId?: string,
    metadata?: any,
    messageId?: string,
  ) {
    const branch = await this.branchRepo.findOneBy({ id: branchId });
    if (!branch) return;
    return this.sendIndividualMessage(
      branch,
      customerId,
      content,
      channel,
      from,
      campaignId,
      metadata,
      messageId,
    );
  }

  async calculateCost(channel: Channel, count: number): Promise<number> {
    const settings = await this.settingsService.getSettings();
    let unitCost = 0;
    if (channel === Channel.SMS)
      unitCost = (settings as any).messagingCostSms || 0;
    else if (channel === Channel.WHATSAPP)
      unitCost = (settings as any).messagingCostWhatsapp || 0;
    else if (channel === Channel.EMAIL)
      unitCost = (settings as any).messagingCostEmail || 0;

    return unitCost * count;
  }

  async sendReply(
    thread: ConversationThread,
    content: string,
    replyToId?: string,
    metadata?: any,
  ) {
    const branch = await this.branchRepo.findOne({
      where: { id: thread.branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    let from = '';
    if (thread.channel === Channel.IN_HOUSE) {
      from = branch.business?.name || branch.name || 'Business';
    } else if (thread.channel === Channel.WHATSAPP) {
      from = formatPhoneNumber(
        this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') ||
          branch.whatsappNumber ||
          '',
      );
    } else {
      from = formatPhoneNumber(branch.whatsappNumber || '');
    }

    // Deduct credits for reply
    if (thread.channel !== Channel.IN_HOUSE) {
      const units =
        content.length > 160 && thread.channel === Channel.SMS ? 2 : 1;
      await this.creditService.deductCredits(
        branch.businessId,
        thread.channel,
        units,
        `Reply to ${thread.customerId}`,
      );
    }

    const msg = await this.sendIndividualMessage(
      branch,
      thread.customerId,
      content,
      thread.channel,
      from,
      undefined,
      metadata,
    );

    // Only save again if we need to update threadId or replyToId that wasn't
    // set correctly by sendIndividualMessage
    const needsUpdate =
      msg.threadId !== thread.id || (replyToId && msg.replyToId !== replyToId);
    if (needsUpdate) {
      msg.threadId = thread.id;
      if (replyToId) {
        msg.replyToId = replyToId;
      }
      await this.messageRepo.save(msg);
    }

    return msg.id;
  }

  async handleInbound(inbound: InboundMessage) {
    const from =
      inbound.channel === Channel.EMAIL
        ? inbound.from
        : formatPhoneNumber(inbound.from);

    const customer = await this.userRepo.findOne({
      where: [{ phone: from }, { email: from }],
    });

    if (!customer) {
      this.logger.warn(`Inbound from unknown customer: ${inbound.from}`);
      return;
    }

    let thread = await this.threadRepo.findOne({
      where: { customerId: customer.id, channel: inbound.channel },
    });

    if (!thread) {
      const lastVisit = await this.visitRepo.findOne({
        where: { customerId: customer.id },
        order: { createdAt: 'DESC' },
      });

      if (!lastVisit) {
        this.logger.warn(
          `Customer ${customer.id} has no visit history to associate inbound message.`,
        );
        return;
      }

      thread = this.threadRepo.create({
        customerId: customer.id,
        branchId: lastVisit.branchId,
        businessId: lastVisit.businessId,
        channel: inbound.channel,
        status: ThreadStatus.OPEN,
      } as any) as unknown as ConversationThread;
      await this.threadRepo.save(thread);
    }

    const message = this.messageRepo.create({
      branchId: thread.branchId,
      businessId: thread.businessId,
      customerId: customer.id,
      content: inbound.content,
      channel: inbound.channel,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.DELIVERED,
      from: inbound.from,
      to: inbound.to,
      providerMessageId: (inbound as any).providerId || (inbound as any).id,
      timestamp: new Date(),
    } as any) as unknown as Message;
    await this.messageRepo.save(message);

    thread.lastActivityAt = new Date();
    thread.lastMessageContent = inbound.content;
    await this.threadRepo.save(thread);
  }

  async handleDeliveryReport(report: DeliveryReport) {
    const providerId = (report as any).providerId || (report as any).id;
    const msg = await this.messageRepo.findOneBy({
      providerMessageId: providerId,
    });
    if (!msg) return;

    msg.status = this.mapStatus(report.status);
    await this.messageRepo.save(msg);

    await this.logRepo.update(
      { messageId: msg.id },
      { status: msg.status, errorReason: (report as any).error },
    );
  }

  private mapStatus(s: string): MessageStatus {
    switch (s.toUpperCase()) {
      case 'DELIVERED':
        return MessageStatus.DELIVERED;
      case 'READ':
        return MessageStatus.READ;
      case 'FAILED':
        return MessageStatus.FAILED;
      case 'PENDING':
        return MessageStatus.PENDING;
      case 'REJECTED':
        return MessageStatus.REJECTED;
      default:
        return MessageStatus.SENT;
    }
  }

  async sendBulkGenericSms(
    messages: Message[],
    content: string,
    from: string,
  ): Promise<void> {
    if (!messages.length) return;

    const to = messages.map((m) => m.to);

    try {
      const providerResult = await this.providerRouter.sendMessage({
        channel: Channel.SMS,
        to,
        content,
        from,
      });

      const status = this.mapProviderStatus(providerResult.status);
      const providerMessageId = providerResult.messageId || '';

      await Promise.all(
        messages.map((msg) => {
          msg.status = status;
          msg.providerMessageId = providerMessageId;
          msg.cost = providerResult.cost
            ? providerResult.cost / messages.length
            : undefined;
          msg.units = providerResult.units
            ? providerResult.units / messages.length
            : undefined;
          msg.reference = providerResult.reference;
          return this.messageRepo.save(msg);
        }),
      );
    } catch (err: any) {
      this.logger.error(`❌ ERROR: Bulk delivery failed: ${err.message}`);
      await Promise.all(
        messages.map((msg) => {
          msg.status = MessageStatus.FAILED;
          return this.messageRepo.save(msg);
        }),
      );
      throw err;
    }
  }
}
