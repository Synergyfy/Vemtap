import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { Channel } from '../enums/channel.enum';
import twilio from 'twilio';

@Injectable()
export class TwilioProvider implements MessagingProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly client: twilio.Twilio;
  private readonly whatsappNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials are not fully configured');
    }
  }

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    if (!this.client) {
      throw new Error('Twilio client not initialized. Check credentials.');
    }

    if (payload.channel !== Channel.WHATSAPP) {
      throw new Error(`Channel ${payload.channel} not supported by TwilioProvider`);
    }

    const to = payload.to.startsWith('whatsapp:') ? payload.to : `whatsapp:${payload.to}`;
    const from = payload.from 
      ? (payload.from.startsWith('whatsapp:') ? payload.from : `whatsapp:${payload.from}`)
      : (this.whatsappNumber.startsWith('whatsapp:') ? this.whatsappNumber : `whatsapp:${this.whatsappNumber}`);

    try {
      const messageOptions: any = {
        to,
        from,
        body: payload.content,
      };

      if (payload.mediaUrl) {
        messageOptions.mediaUrl = [payload.mediaUrl];
      }

      const response = await this.client.messages.create(messageOptions);

      return {
        messageId: response.sid,
        status: this.mapTwilioStatus(response.status),
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`Twilio WhatsApp Send Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    if (!payload) return null;

    // Twilio Inbound Message
    if (payload.SmsSid && payload.Body && payload.From) {
      return {
        type: 'inbound',
        data: {
          from: payload.From.replace('whatsapp:', ''),
          to: payload.To.replace('whatsapp:', ''),
          content: payload.Body,
          providerMessageId: payload.SmsSid,
          channel: Channel.WHATSAPP,
          timestamp: new Date(),
          rawPayload: payload,
        },
      };
    }

    // Twilio Delivery Report
    if (payload.MessageSid && payload.MessageStatus) {
      return {
        type: 'delivery',
        data: {
          messageId: payload.MessageSid,
          status: this.mapTwilioStatus(payload.MessageStatus),
          rawPayload: payload,
        },
      };
    }

    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    // Default Twilio WhatsApp cost estimate
    return 15.0;
  }

  private mapTwilioStatus(status: string): any {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'read':
        return 'DELIVERED';
      case 'undelivered':
      case 'failed':
        return 'FAILED';
      case 'sent':
        return 'SENT';
      case 'queued':
      case 'accepted':
        return 'QUEUED';
      default:
        return 'SENT';
    }
  }
}
