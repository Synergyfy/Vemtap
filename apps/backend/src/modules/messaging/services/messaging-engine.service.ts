import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Contact } from '../../contacts/entities/contact.entity';
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
import { User } from '../../users/entities/user.entity';
import { AudienceType } from '../entities/message-campaign.entity';
import { LoyaltyProfile } from '../../campaigns/entities/loyalty-profile.entity';
import {
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { formatPhoneNumber } from '../../../common/utils/phone.util';

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
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(MessageLog)
    private readonly logRepo: Repository<MessageLog>,
    @InjectRepository(ConversationThread)
    private readonly threadRepo: Repository<ConversationThread>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(LoyaltyProfile)
    private readonly loyaltyRepo: Repository<LoyaltyProfile>,
    @InjectQueue('messaging-batch-send') private readonly batchQueue: Queue,
    @InjectQueue('messaging-individual-send') private readonly individualQueue: Queue,
    private readonly complianceService: ComplianceService,
    private readonly creditService: CreditService,
    private readonly templateService: TemplateService,
    private readonly campaignService: CampaignService,
    private readonly settingsService: SettingsService,
    private readonly providerRouter: ProviderRouterService,
    private readonly branchesService: BranchesService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
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
      contactIds,
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

    // 1. Resolve Contacts
    let targetContactIds: string[] = contactIds || [];

    if (audienceType === AudienceType.ALL) {
      const allContacts = await this.contactRepo.find({
        where: { branchId, optOut: false },
        select: ['id'],
      });
      targetContactIds = allContacts.map((c) => c.id);
    } else if (audienceType === AudienceType.RECENT) {
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentContacts = await this.contactRepo
        .createQueryBuilder('contact')
        .where('contact.branchId = :branchId', { branchId })
        .andWhere('contact.optOut = :optOut', { optOut: false })
        .andWhere('contact.updatedAt >= :thirtyDaysAgo', { thirtyDaysAgo })
        .select(['contact.id'])
        .getMany();
      targetContactIds = recentContacts.map((c) => c.id);
    } else if (audienceType === AudienceType.TAGGED) {
      // Any contacts with tags
      const taggedContacts = await this.contactRepo
        .createQueryBuilder('contact')
        .where('contact.branchId = :branchId', { branchId })
        .andWhere('contact.optOut = :optOut', { optOut: false })
        .andWhere('contact.tags IS NOT NULL')
        .select(['contact.id'])
        .getMany();
      targetContactIds = taggedContacts.map((c) => c.id);
    }

    if (targetContactIds.length === 0) {
      throw new BadRequestException('No contacts found for selected audience');
    }

    // 2. Validate Credits
    const wallet = await this.creditService.getOrCreateWallet(effectiveBusinessId);
    let balance = 0;
    if (channel === Channel.SMS) balance = wallet.smsCredits;
    else if (channel === Channel.EMAIL) balance = wallet.emailCredits;
    else if (channel === Channel.WHATSAPP) balance = wallet.whatsappCredits;

    // 4. Resolve Content (if template)
    let baseContent = content || '';
    if (templateId) {
      const template = await this.templateService.findOne(templateId);
      baseContent = template.content;
    }

    // 3. Compliance Check (Opt-outs)
    const validContacts = await this.contactRepo.find({
      where: {
        id: In(targetContactIds),
        optOut: false,
      },
    });

    if (validContacts.length === 0) {
      return { 
        message: 'No valid contacts to send to (all opted out)',
        count: 0,
        messageIds: []
      };
    }

    let totalCreditsNeeded = 0;
    if (channel === Channel.SMS) {
      for (const contact of validContacts) {
        const resolved = await this.resolvePlaceholdersSync(baseContent, contact, branch);
        totalCreditsNeeded += resolved.length > 160 ? 2 : 1;
      }
    } else {
      totalCreditsNeeded = validContacts.length;
    }

    if (balance < totalCreditsNeeded) {
      throw new BadRequestException(
        `Insufficient ${channel} credits. Need ${totalCreditsNeeded}, but you only have ${balance}. Please top up.`,
      );
    }

    const validContactIds = validContacts.map((c) => c.id);

    // 5. Determine "From" number/id
    let from = dto.from || '';
    if (channel === Channel.SMS && !from) {
      from = 'VEMTAP'; // Use default sender ID for all businesses for now
    }
    
    if (channel === Channel.WHATSAPP && !from) {
      // TODO: Restore database fallback (branch/business settings) when ready for production.
      // Currently forcing .env for WhatsApp Sandbox compatibility.
      from = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';
      
      if (!from) {
        from = branch.whatsappNumber || (branch.business as any)?.whatsappNumber || '';
        if (!from) {
          const settings = await this.settingsService.getSettings();
          from = (settings as any).whatsappNumber;
        }
      }
      from = formatPhoneNumber(from);
    }

    // 6. Create Campaign Record if more than one recipient
    let campaignId: string | undefined;
    if (validContactIds.length > 1 || audienceType) {
      const campaign = await this.campaignService.createCampaign({
        name: `Campaign ${new Date().toISOString()}`,
        branchId,
        businessId: businessId || branch.businessId,
        channel,
        audienceType: audienceType || AudienceType.ALL,
        audienceSize: validContactIds.length,
        content: baseContent,
        templateId,
      } as any);
      campaignId = campaign.id;
    }

    // 7. Batch or Single?
    if (validContactIds.length > 50) {
      await this.batchQueue.add('send-batch', {
        ...dto,
        campaignId,
        contactIds: validContactIds,
        content: baseContent,
        from,
      });
      return { 
        message: 'Batch campaign queued', 
        status: 'QUEUED', 
        campaignId,
        count: validContactIds.length,
        messageIds: []
      };
    }

    // 8. Queue Individual Messages for Background Processing
    for (const contactId of validContactIds) {
      await this.individualQueue.add('send-individual', {
        branchId,
        contactId,
        content: baseContent,
        channel,
        from,
        campaignId,
      });
    }

    return {
      message: 'Messages queued for background processing',
      status: 'QUEUED',
      count: validContactIds.length,
      messageIds: [],
      campaignId,
    };
  }

  private resolvePlaceholdersSync(
    content: string,
    contact: Contact,
    branch: Branch,
  ): string {
    if (!content) return '';

    let resolved = content;

    // --- Contact Placeholders ---
    const fullName = contact.name || 'Customer';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    resolved = resolved.replace(/{Name}/g, fullName);
    resolved = resolved.replace(/{FirstName}/g, firstName);
    resolved = resolved.replace(/{LastName}/g, lastName || '');
    resolved = resolved.replace(/{Email}/g, contact.email || '');
    resolved = resolved.replace(/{Phone}/g, formatPhoneNumber(contact.phone || ''));

    // --- Business/Branch Placeholders ---
    const bizName = branch.business?.name || branch.name || 'Our Business';
    resolved = resolved.replace(/{BusinessName}/g, bizName);
    resolved = resolved.replace(/{BranchName}/g, branch.name || '');
    resolved = resolved.replace(/{BranchAddress}/g, branch.address || '');
    resolved = resolved.replace(/{BranchCity}/g, branch.city || '');
    resolved = resolved.replace(/{BranchPhone}/g, formatPhoneNumber(branch.phone || ''));
    resolved = resolved.replace(/{Website}/g, branch.website || '');
    resolved = resolved.replace(/{ReviewLink}/g, branch.reviewUrl || '');
    resolved = resolved.replace(/{Link}/g, branch.website || branch.reviewUrl || '');

    // Loyalty points placeholder is tricky because it requires DB call.
    // For credit estimation, we can assume it's a reasonable number (e.g. 4-5 digits max)
    // or just leave it if we want to be safe. Let's use "0000" as a placeholder for points estimation.
    resolved = resolved.replace(/{Points}/g, '0000');

    return resolved;
  }

  private async sendIndividualMessage(
    branch: Branch,
    contactId: string,
    content: string,
    channel: Channel,
    from: string,
    campaignId?: string,
  ): Promise<Message> {
    const contact = await this.contactRepo.findOneBy({ id: contactId });
    if (!contact) throw new NotFoundException('Contact not found');

    const resolvedContent = await this.resolvePlaceholders(content, contactId, branch);

    // Credit Check (for individual messages like replies that bypass bulk check)
    if (!campaignId) {
      const wallet = await this.creditService.getOrCreateWallet(branch.businessId);
      let balance = 0;
      if (channel === Channel.SMS) balance = wallet.smsCredits;
      else if (channel === Channel.EMAIL) balance = wallet.emailCredits;
      else if (channel === Channel.WHATSAPP) balance = wallet.whatsappCredits;

      if (balance < 1) {
        throw new BadRequestException(`Insufficient ${channel} credits`);
      }
    }

    // Find or create conversation thread
    let thread = await this.threadRepo.findOne({
      where: {
        branchId: branch.id,
        contactId,
        channel,
      },
    });

    if (!thread) {
      thread = this.threadRepo.create({
        branchId: branch.id,
        businessId: branch.businessId,
        contactId,
        channel,
        status: 'OPEN' as any,
      } as any) as unknown as ConversationThread;
      await this.threadRepo.save(thread);
    }

    const message = this.messageRepo.create({
      branchId: branch.id,
      businessId: branch.businessId,
      contactId,
      threadId: thread.id,
      campaignId,
      content: resolvedContent,
      channel,
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.PENDING,
      from,
      to: channel === Channel.EMAIL 
        ? (contact.email || '') 
        : formatPhoneNumber(contact.phone || ''),
    } as any) as unknown as Message;

    const savedMessageResult = await this.messageRepo.save(message);
    const savedMessage = (
      Array.isArray(savedMessageResult)
        ? savedMessageResult[0]
        : savedMessageResult
    ) as Message;

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

      // Deduct credits based on units used
      if (
        savedMessage.status === MessageStatus.SENT ||
        savedMessage.status === MessageStatus.PENDING
      ) {
        let units = providerResult.units || 1;
        if (channel === Channel.SMS && savedMessage.content.length > 160) {
          units = 2; // Business rule: SMS > 160 chars costs 2 units
        }
        await this.creditService.deductCredits(
          branch.businessId,
          channel,
          units,
          `Message to ${savedMessage.to}`,
        );
      }

      await this.logMessage(savedMessage);
    } catch (err: any) {
      this.logger.error(
        `Failed to send message ${savedMessage.id}: ${err.message}`,
      );
      savedMessage.status = MessageStatus.FAILED;
      await this.messageRepo.save(savedMessage);
    }

    return savedMessage;
  }

  private async resolvePlaceholders(
    content: string,
    contactId: string,
    branch: Branch,
  ): Promise<string> {
    if (!content) return '';

    const contact = await this.contactRepo.findOneBy({ id: contactId });
    if (!contact) return content;

    let resolved = content;

    // --- Contact Placeholders ---
    const fullName = contact.name || 'Customer';
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    resolved = resolved.replace(/{Name}/g, fullName);
    resolved = resolved.replace(/{FirstName}/g, firstName);
    resolved = resolved.replace(/{LastName}/g, lastName || '');
    resolved = resolved.replace(/{Email}/g, contact.email || '');
    resolved = resolved.replace(/{Phone}/g, formatPhoneNumber(contact.phone || ''));

    // --- Business/Branch Placeholders ---
    const bizName = branch.business?.name || branch.name || 'Our Business';
    resolved = resolved.replace(/{BusinessName}/g, bizName);
    resolved = resolved.replace(/{BranchName}/g, branch.name || '');
    resolved = resolved.replace(/{BranchAddress}/g, branch.address || '');
    resolved = resolved.replace(/{BranchCity}/g, branch.city || '');
    resolved = resolved.replace(/{BranchPhone}/g, formatPhoneNumber(branch.phone || ''));
    resolved = resolved.replace(/{Website}/g, branch.website || '');
    resolved = resolved.replace(/{ReviewLink}/g, branch.reviewUrl || '');
    resolved = resolved.replace(/{Link}/g, branch.website || branch.reviewUrl || '');

    // --- Loyalty Placeholders ---
    try {
      const profile = await this.loyaltyRepo.findOne({
        where: { branchId: branch.id, userId: contact.id },
      });
      const points = profile?.currentPointsBalance || 0;
      resolved = resolved.replace(/{Points}/g, points.toString());
    } catch (e) {
      resolved = resolved.replace(/{Points}/g, '0');
    }

    return resolved;
  }

  private mapProviderStatus(status: string): MessageStatus {
    switch (status) {
      case 'queued': return MessageStatus.PENDING;
      case 'sent': return MessageStatus.SENT;
      case 'failed': return MessageStatus.FAILED;
      default: return MessageStatus.SENT;
    }
  }

  private async logMessage(msg: Message) {
    const log = this.logRepo.create({
      branchId: msg.branchId,
      businessId: (msg as any).businessId,
      messageId: msg.id,
      contactId: msg.contactId,
      channel: msg.channel,
      direction: msg.direction,
      status: msg.status,
      timestamp: new Date(),
    } as any) as unknown as MessageLog;
    await this.logRepo.save(log);
  }

  // Restore missing methods for other components
  async updateDeliveryStatus(
    messageId: string,
    status: MessageStatus,
    error?: string,
  ) {
    await this.messageRepo.update(messageId, { status });
    await this.logRepo.update({ messageId }, { status, errorReason: error });
  }

  async processSingleSend(
    branchId: string,
    contactId: string,
    content: string,
    channel: Channel,
    from: string,
    campaignId?: string,
  ) {
    const branch = await this.branchRepo.findOneBy({ id: branchId });
    if (!branch) return;
    return this.sendIndividualMessage(
      branch,
      contactId,
      content,
      channel,
      from,
      campaignId,
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

  async sendReply(thread: ConversationThread, content: string) {
    const branch = await this.branchRepo.findOne({
      where: { id: thread.branchId },
      relations: ['business'],
    });
    if (!branch) throw new NotFoundException('Branch not found');

    let from = '';
    if (thread.channel === Channel.IN_HOUSE) {
      from = branch.business?.name || branch.name || 'Business';
    } else if (thread.channel === Channel.WHATSAPP) {
      // TODO: Restore database fallback when ready for production
      from = formatPhoneNumber(this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || branch.whatsappNumber || '');
    } else {
      from = formatPhoneNumber(branch.whatsappNumber || '');
    }

    const msg = await this.sendIndividualMessage(
      branch,
      thread.contactId,
      content,
      thread.channel,
      from,
    );
    (msg as any).threadId = thread.id;
    await this.messageRepo.save(msg);
    return msg.id;
  }

  // --- Webhooks & Events ---

  async handleInbound(inbound: InboundMessage) {
    const from = inbound.channel === Channel.EMAIL 
      ? inbound.from 
      : formatPhoneNumber(inbound.from);
      
    const contact = await this.contactRepo.findOne({
      where: [{ phone: from }, { email: from }],
    });

    if (!contact) {
      this.logger.warn(`Inbound from unknown contact: ${inbound.from}`);
      return;
    }

    let thread = await this.threadRepo.findOne({
      where: { contactId: contact.id, channel: inbound.channel },
    });

    if (!thread) {
      thread = this.threadRepo.create({
        contactId: contact.id,
        branchId: contact.branchId,
        businessId: (contact as any).businessId,
        channel: inbound.channel,
        status: 'OPEN' as any,
      } as any) as unknown as ConversationThread;
      await this.threadRepo.save(thread);
    }

    const message = this.messageRepo.create({
      branchId: contact.branchId,
      businessId: (contact as any).businessId,
      contactId: contact.id,
      content: inbound.content,
      channel: inbound.channel,
      direction: MessageDirection.INBOUND,
      status: MessageStatus.DELIVERED,
      from: inbound.from,
      to: inbound.to,
      providerMessageId: (inbound as any).providerId || (inbound as any).id,
    } as any) as unknown as Message;
    await this.messageRepo.save(message);

    (thread as any).lastMessageAt = new Date();
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
}
