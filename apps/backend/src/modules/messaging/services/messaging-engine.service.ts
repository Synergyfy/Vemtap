import { Injectable, Logger, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { Contact } from '../../contacts/entities/contact.entity';
import { Business } from '../../businesses/entities/business.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Message, MessageDirection, MessageStatus } from '../entities/message.entity';
import { MessageLog } from '../entities/message-log.entity';
import { MessageCampaign, CampaignStatus } from '../entities/message-campaign.entity';
import { ConversationThread, ThreadStatus } from '../entities/conversation-thread.entity';
import { Channel } from '../enums/channel.enum';

import { SendMessageDto } from '../dto/send-message.dto';
import { ComplianceService } from './compliance.service';
import { CreditService } from './credit.service';
import { TemplateService } from './template.service';
import { CampaignService } from './campaign.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import { EmailService } from './email.service';
import { SettingsService } from '../../settings/settings.service';

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
        private readonly smsService: SmsService,
        private readonly whatsappService: WhatsappService,
        private readonly emailService: EmailService,
        private readonly settingsService: SettingsService,
        private readonly dataSource: DataSource,
    ) { }

    public async sendMessage(dto: SendMessageDto): Promise<{ campaignId?: string; messageIds?: string[] }> {
        const business = await this.businessRepo.findOne({ where: { id: dto.businessId } });
        if (!business) throw new BadRequestException('Business not found');

        let template: any = null;
        if (dto.templateId) {
            template = await this.templateService.getTemplate(dto.templateId, dto.businessId);
        }

        const contacts = await this.resolveAudience(dto);
        if (!contacts.length) {
            throw new BadRequestException('Resolved audience is empty');
        }

        const estimatedCost = await this.calculateCost(contacts.length, dto.channel);

        // Check credits and deduct upfront (transacted)
        await this.creditService.deduct(dto.businessId, estimatedCost, `Send ${contacts.length} messages via ${dto.channel}`);

        if (contacts.length === 1) {
            // Direct single send
            const contact = contacts[0];
            const messageId = await this.processSingleSend(contact, dto, business, template);
            return { messageIds: [messageId] };
        } else {
            // Campaign batch send - need branchId
            let branchId = dto.branchId;
            if (!branchId) {
                const branch = await this.branchRepo.findOne({
                    where: { businessId: dto.businessId },
                });
                if (!branch) throw new BadRequestException('No branch found for business; branchId required');
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
                contactIds: contacts.map(c => c.id),
                templateId: dto.templateId,
                content: dto.content,
            });

            return { campaignId: campaign.id };
        }
    }

    public async sendReply(thread: ConversationThread, content: string): Promise<string | null> {
        const dto: SendMessageDto = {
            businessId: thread.businessId,
            channel: thread.channel,
            contactIds: [thread.contactId],
            content,
        };
        const res = await this.sendMessage(dto);
        if (res.messageIds && res.messageIds.length > 0) {
            // attach thread
            await this.messageRepo.update({ id: res.messageIds[0] }, { threadId: thread.id });
            return res.messageIds[0];
        }
        return null;
    }

    public async handleInbound(payload: any, channel: Channel): Promise<void> {
        // 1. Map payload to incoming values based on channel
        let incomingFrom = '', incomingTo = '', text = '', infobipMessageId: string | undefined = undefined;

        if (channel === Channel.SMS || channel === Channel.WHATSAPP) {
            // Assuming Infobip common inbound format: payload.results[0]
            const msg = payload.results?.[0];
            if (!msg) return;

            incomingFrom = msg.from;
            incomingTo = msg.to;
            text = msg.message?.text || '';
            infobipMessageId = msg.messageId;
        } else if (channel === Channel.EMAIL) {
            incomingFrom = payload.from;
            incomingTo = payload.to;
            text = payload.text || '';
            infobipMessageId = payload.messageId;
        }

        this.logger.log(`Inbound ${channel} from ${incomingFrom} to ${incomingTo}`);

        // 2. Identify business by "to" (business mapped sender ID or email)
        // Note: In real scenarios, we must have a mapping table: BusinessChannels { businessId, value, channel }
        // As a simplification for the PRD, we assume we find business by matching the generic logic or fallback.
        // Given no schema for sender routing mapping, we fallback to first business or custom logic.
        const business = await this.businessRepo.findOne({ order: { createdAt: 'ASC' } });
        if (!business) return;

        // 3. Find or Create Contact for the business
        let contact = await this.contactRepo.findOne({ where: { businessId: business.id, phone: incomingFrom } });
        if (!contact && channel === Channel.EMAIL) {
            contact = await this.contactRepo.findOne({ where: { businessId: business.id, email: incomingFrom } });
        }
        if (!contact) {
            const newContact = this.contactRepo.create({
                businessId: business.id,
                name: 'Unknown ' + incomingFrom,
                optInChannels: [channel],
            });
            if (channel !== Channel.EMAIL) {
                newContact.phone = incomingFrom;
            } else {
                newContact.email = incomingFrom;
            }
            contact = await this.contactRepo.save(newContact);
        }

        const safeContact = contact!;

        // Handle Opt-Out (STOP, UNSUBSCRIBE)
        if (text.trim().toUpperCase() === 'STOP' || text.trim().toUpperCase() === 'UNSUBSCRIBE') {
            this.complianceService.handleOptOut(safeContact);
            await this.contactRepo.save(safeContact);
            this.logger.log(`Contact ${safeContact.id} opted out via inbound message.`);
        }

        // 4. Find or Create Thread
        let thread = await this.threadRepo.findOne({ where: { businessId: business.id, contactId: safeContact.id, channel } });
        if (!thread) {
            thread = this.threadRepo.create({ businessId: business.id, contactId: safeContact.id, channel });
        }
        thread.lastActivityAt = new Date();
        thread.status = ThreadStatus.OPEN;
        thread = await this.threadRepo.save(thread);

        // 5. Create Message
        const message = this.messageRepo.create({
            businessId: business.id,
            contactId: safeContact.id,
            threadId: thread.id,
            direction: MessageDirection.INBOUND,
            content: text,
            status: MessageStatus.DELIVERED,
            infobipMessageId,
        });
        await this.messageRepo.save(message);

        // 6. Socket emit to business room
        // Assuming a global websocket gateway listens to 'business-{id}'
        // e.g., webhooks / gateways handle it, here we'd inject EventEmitter or direct Socket
        this.logger.log(`[SocketEmit] 'inbox:new-message' to room business-${business.id}`);
    }

    public async updateDeliveryStatus(payload: any): Promise<void> {
        const results = payload.results || [];
        for (const result of results) {
            const msgId = result.messageId;
            const statusName = result.status?.name; // PENDING, DELIVERED, REJECTED etc.

            if (!msgId || !statusName) continue;

            const message = await this.messageRepo.findOne({ where: { infobipMessageId: msgId } });
            if (message) {
                message.status = this.mapInfobipStatus(statusName);
                await this.messageRepo.save(message);

                const log = await this.logRepo.findOne({ where: { infobipMessageId: msgId } as any }); // If we stored it
                if (log) {
                    log.status = message.status;
                    await this.logRepo.save(log);
                }

                // If part of campaign, we could update metrics here or periodically.
            }
        }
    }

    // --- Helpers ---

    public async processSingleSend(contact: Contact, dto: SendMessageDto, business: Business, template: any): Promise<string> {
        try {
            this.complianceService.validateConsentBeforeSend(contact, dto.channel);

            let finalContent = dto.content || '';
            if (template) {
                finalContent = this.templateService.render(template.content, {
                    Name: contact.name || 'Customer'
                });
            }

            let infobipId: string | undefined = undefined;
            const senderId = business.name || 'VemTap'; // Or mapping

            if (dto.channel === Channel.SMS) {
                infobipId = await this.smsService.sendSingle(senderId, contact.phone, finalContent);
            } else if (dto.channel === Channel.WHATSAPP) {
                infobipId = await this.whatsappService.sendSingle(senderId, contact.phone, finalContent);
            } else if (dto.channel === Channel.EMAIL) {
                infobipId = await this.emailService.sendSingle('no-reply@vemtap.com', contact.email, 'Message', finalContent);
            }

            const message = await this.messageRepo.save(this.messageRepo.create({
                businessId: dto.businessId,
                contactId: contact.id,
                direction: MessageDirection.OUTBOUND,
                content: finalContent,
                status: MessageStatus.SENT,
                infobipMessageId: infobipId,
            }));

            await this.logRepo.save(this.logRepo.create({
                businessId: dto.businessId,
                branchId: dto.branchId,
                contactId: contact.id,
                channel: dto.channel,
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.SENT,
                messageId: message.id,
            }));

            return message.id;
        } catch (error) {
            await this.logRepo.save(this.logRepo.create({
                businessId: dto.businessId,
                branchId: dto.branchId,
                contactId: contact.id,
                channel: dto.channel,
                direction: MessageDirection.OUTBOUND,
                status: MessageStatus.FAILED,
                errorReason: error.message,
            }));
            this.logger.error(`Send Failed for contact ${contact.id}: ${error.message}`);
            throw error;
        }
    }

    private async resolveAudience(dto: SendMessageDto): Promise<Contact[]> {
        if (dto.contactIds && dto.contactIds.length > 0) {
            return this.contactRepo.findBy({ id: In(dto.contactIds) });
        }
        // Very basic audience resolution stub based on PRD
        // If ALL, get all matching the optIn parameter.
        return this.contactRepo.find({ where: { businessId: dto.businessId } });
    }

    public async calculateCost(count: number, channel: Channel): Promise<number> {
        const settings = await this.settingsService.getGlobalSettings();

        // Settings returns default decimals based on the DB schema if unset
        switch (channel) {
            case Channel.SMS: return count * (Number(settings.messagingCostSms) || 0.05);
            case Channel.WHATSAPP: return count * (Number(settings.messagingCostWhatsapp) || 0.08);
            case Channel.EMAIL: return count * (Number(settings.messagingCostEmail) || 0.01);
            default: return count * 0.01;
        }
    }

    private mapInfobipStatus(status: string): MessageStatus {
        switch (status.toUpperCase()) {
            case 'DELIVERED_TO_HANDSET': return MessageStatus.DELIVERED;
            case 'REJECTED': return MessageStatus.REJECTED;
            case 'PENDING': return MessageStatus.PENDING;
            case 'DELIVERED': return MessageStatus.DELIVERED;
            default: return MessageStatus.SENT;
        }
    }
}
