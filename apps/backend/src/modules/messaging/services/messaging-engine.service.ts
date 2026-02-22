import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { Contact } from '../../contacts/entities/contact.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import {
  Message,
  MessageDirection,
  MessageStatus,
} from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import {
  MessageCampaign,
  CampaignStatus,
} from '../entities/message-campaign.entity';
import {
  ConversationThread,
  ThreadStatus,
} from '../entities/conversation-thread.entity';
import { Channel } from '../enums/channel.enum';

import { SendMessageDto } from '../dto/send-message.dto';
import { ComplianceService } from './compliance.service';
import { CreditService } from './credit.service';
import { TemplateService } from './template.service';
import { CampaignService } from './campaign.service';
import { SettingsService } from '../../settings/settings.service';
import { ProviderRouterService } from './provider-router.service';
import { InboundMessage, DeliveryReport } from '../interfaces/messaging-provider.interface';

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
    @InjectRepository(Business)
    private readonly businessRepo: Repository<Business>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectQueue('messaging-batch-send') private readonly batchQueue: Queue,
    private readonly complianceService: ComplianceService,
    private readonly creditService: CreditService,
    private readonly templateService: TemplateService,
    private readonly campaignService: CampaignService,
    private readonly settingsService: SettingsService,
    private readonly providerRouter: ProviderRouterService,
    private readonly dataSource: DataSource,
  ) {}

  public async sendMessage(
    dto: SendMessageDto,
  ): Promise<{ campaignId?: string; messageIds?: string[] }> {
    const business = await this.businessRepo.findOne({
      where: { id: dto.businessId },
    });
    if (!business) throw new BadRequestException('Business not found');

    let template: any = null;
    if (dto.templateId) {
      template = await this.templateService.getTemplate(
        dto.templateId,
        dto.businessId,
      );
    }

    const contacts = await this.resolveAudience(dto);
    if (!contacts.length) {
      throw new BadRequestException('Resolved audience is empty');
    }

    const estimatedCost = await this.calculateCost(
      contacts.length,
      dto.channel,
    );

    // Check credits and deduct upfront (transacted)
    await this.creditService.deduct(
      dto.businessId,
      estimatedCost,
      `Send ${contacts.length} messages via ${dto.channel}`,
    );

    if (contacts.length === 1) {
      // Direct single send
      const contact = contacts[0];
      const messageId = await this.processSingleSend(
        contact,
        dto,
        business,
        template,
      );
      return { messageIds: [messageId] };
    } else {
      // Campaign batch send - need branchId
      let branchId = dto.branchId;
      if (!branchId) {
        const branch = await this.branchRepo.findOne({
          where: { businessId: dto.businessId },
        });
        if (!branch)
          throw new BadRequestException(
            'No branch found for business; branchId required',
          );
        branchId = branch.id;
      }

      const campaign = await this.campaignService.createCampaign({
        branchId,
        name: `Campaign ${new Date().toISOString()}`,
        channel: dto.channel,
        audienceType: dto.audienceType,
        audienceSize: contacts.length,
        templateId: dto.templateId,
        content: dto.content,
        estimatedCost,
        status: CampaignStatus.PROCESSING,
      });

      // Queue BullMQ Job
      await this.batchQueue.add('send:batch', {
        campaignId: campaign.id,
        businessId: dto.businessId,
        branchId,
        channel: dto.channel,
        contactIds: contacts.map((c) => c.id),
        templateId: dto.templateId,
        content: dto.content,
      });

      return { campaignId: campaign.id };
    }
  }

  public async sendReply(
    thread: ConversationThread,
    content: string,
  ): Promise<string | null> {
    const dto: SendMessageDto = {
      businessId: thread.businessId,
      channel: thread.channel,
      contactIds: [thread.contactId],
      content,
    };
    const res = await this.sendMessage(dto);
    if (res.messageIds && res.messageIds.length > 0) {
      // attach thread
      await this.messageRepo.update(
        { id: res.messageIds[0] },
        { threadId: thread.id },
      );
      return res.messageIds[0];
    }
    return null;
  }

  public async handleInbound(message: InboundMessage): Promise<void> {
    this.logger.log(`Inbound ${message.channel} from ${message.from} to ${message.to}`);

    const business = await this.businessRepo.findOne({
      order: { createdAt: 'ASC' },
    });
    if (!business) {
        this.logger.warn(`No business found for inbound message to ${message.to}`);
        return;
    }

    let contact = await this.contactRepo.findOne({
      where: { businessId: business.id, phone: message.from },
    });
    if (!contact && message.channel === Channel.EMAIL) {
      contact = await this.contactRepo.findOne({
        where: { businessId: business.id, email: message.from },
      });
    }
    if (!contact) {
      const newContact = this.contactRepo.create({
        businessId: business.id,
        name: 'Unknown ' + message.from,
        optInChannels: [message.channel],
      });
      if (message.channel !== Channel.EMAIL) {
        newContact.phone = message.from;
      } else {
        newContact.email = message.from;
      }
      contact = await this.contactRepo.save(newContact);
    }

    const safeContact = contact;

    if (
      message.content.trim().toUpperCase() === 'STOP' ||
      message.content.trim().toUpperCase() === 'UNSUBSCRIBE'
    ) {
      this.complianceService.handleOptOut(safeContact);
      await this.contactRepo.save(safeContact);
      this.logger.log(
        `Contact ${safeContact.id} opted out via inbound message.`,
      );
    }

    let thread = await this.threadRepo.findOne({
      where: { businessId: business.id, contactId: safeContact.id, channel: message.channel },
    });
    if (!thread) {
      thread = this.threadRepo.create({
        businessId: business.id,
        contactId: safeContact.id,
        channel: message.channel,
      });
    }
    thread.lastActivityAt = new Date();
    thread.status = ThreadStatus.OPEN;
    thread = await this.threadRepo.save(thread);

    const msgEntity = this.messageRepo.create({
      businessId: business.id,
      contactId: safeContact.id,
      threadId: thread.id,
      direction: MessageDirection.INBOUND,
      content: message.content,
      status: MessageStatus.DELIVERED,
      providerMessageId: message.providerMessageId,
      channel: message.channel,
      timestamp: message.timestamp,
    });
    await this.messageRepo.save(msgEntity);

    this.logger.log(
      `[SocketEmit] 'inbox:new-message' to room business-${business.id}`,
    );
  }

  public async updateDeliveryStatus(report: DeliveryReport): Promise<void> {
    const msgId = report.messageId;
    const statusName = report.status;

    if (!msgId || !statusName) return;

    const message = await this.messageRepo.findOne({
      where: { providerMessageId: msgId },
    });
    if (message) {
      message.status = this.mapProviderStatus(statusName);
      await this.messageRepo.save(message);
    }
  }

  // --- Helpers ---

  public async processSingleSend(
    contact: Contact,
    dto: SendMessageDto,
    business: Business,
    template: any,
  ): Promise<string> {
    try {
      this.complianceService.validateConsentBeforeSend(contact, dto.channel);

      let finalContent = dto.content || '';
      if (template) {
        finalContent = this.templateService.render(template.content, {
          Name: contact.name || 'Customer',
        });
      }

      const senderId = business.name || 'VemTap';
      const from = (dto.channel === Channel.WHATSAPP && business.whatsappNumber) ? business.whatsappNumber : senderId;

      const response = await this.providerRouter.sendMessage({
        to: (dto.channel === Channel.EMAIL) ? contact.email : contact.phone,
        from,
        content: finalContent,
        channel: dto.channel,
      });

      const message = await this.messageRepo.save(
        this.messageRepo.create({
          businessId: dto.businessId,
          contactId: contact.id,
          direction: MessageDirection.OUTBOUND,
          content: finalContent,
          status: MessageStatus.SENT,
          providerMessageId: response.messageId,
          channel: dto.channel,
          cost: await this.providerRouter.estimateCost({
              to: (dto.channel === Channel.EMAIL) ? contact.email : contact.phone,
              from,
              content: finalContent,
              channel: dto.channel
          })
        }),
      );

      await this.logRepo.save(
        this.logRepo.create({
          businessId: dto.businessId,
          branchId: dto.branchId,
          contactId: contact.id,
          channel: dto.channel,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.SENT,
          messageId: message.id,
        }),
      );

      return message.id;
    } catch (error) {
      await this.logRepo.save(
        this.logRepo.create({
          businessId: dto.businessId,
          branchId: dto.branchId,
          contactId: contact.id,
          channel: dto.channel,
          direction: MessageDirection.OUTBOUND,
          status: MessageStatus.FAILED,
          errorReason: error.message,
        }),
      );
      this.logger.error(
        `Send Failed for contact ${contact.id}: ${error.message}`,
      );
      throw error;
    }
  }

  private async resolveAudience(dto: SendMessageDto): Promise<Contact[]> {
    if (dto.contactIds && dto.contactIds.length > 0) {
      return this.contactRepo.findBy({ id: In(dto.contactIds) });
    }
    return this.contactRepo.find({ where: { businessId: dto.businessId } });
  }

  public async calculateCost(count: number, channel: Channel): Promise<number> {
    const settings = await this.settingsService.getGlobalSettings();
    switch (channel) {
      case Channel.SMS:
        return count * (Number(settings.messagingCostSms) || 0.05);
      case Channel.WHATSAPP:
        return count * (Number(settings.messagingCostWhatsapp) || 0.08);
      case Channel.EMAIL:
        return count * (Number(settings.messagingCostEmail) || 0.01);
      default:
        return count * 0.01;
    }
  }

  private mapProviderStatus(status: string): MessageStatus {
      switch(status.toUpperCase()) {
          case 'DELIVERED': return MessageStatus.DELIVERED;
          case 'SENT': return MessageStatus.SENT;
          case 'FAILED': return MessageStatus.FAILED;
          case 'PENDING': return MessageStatus.PENDING;
          case 'REJECTED': return MessageStatus.REJECTED;
          default: return MessageStatus.SENT;
      }
  }
}
