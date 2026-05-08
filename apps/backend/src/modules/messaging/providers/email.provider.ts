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
      Array.isArray(payload.to) ? payload.to[0] : payload.to,
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
    // Resend webhook parsing can be added here for delivery status tracking
    // See: https://resend.com/docs/dashboard/webhooks/introduction
    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    return 0.01; // Low cost for email
  }
}
