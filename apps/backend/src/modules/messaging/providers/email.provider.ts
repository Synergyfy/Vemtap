import { Injectable, Logger } from '@nestjs/common';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class EmailProvider implements MessagingProvider {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(private readonly mailService: MailService) {}

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    const success = await this.mailService.sendGenericEmail(
      payload.to,
      payload.from || 'VemTap',
      payload.content,
    );

    if (success) {
      return {
        messageId: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'sent',
      };
    }

    return {
      messageId: null,
      status: 'failed',
    };
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    // Nodemailer doesn't typically handle webhooks for inbound or delivery reports
    // This would require a more sophisticated email provider like SendGrid or Postmark
    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    return 0.01; // Low cost for email
  }
}
