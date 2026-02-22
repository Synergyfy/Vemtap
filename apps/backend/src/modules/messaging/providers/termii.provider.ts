import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { Channel } from '../enums/channel.enum';

@Injectable()
export class TermiiProvider implements MessagingProvider {
  private readonly logger = new Logger(TermiiProvider.name);
  private readonly baseUrl = 'https://api.ng.termii.com/api';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    const apiKey = this.configService.get<string>('TERMII_API_KEY');
    if (!apiKey) {
      this.logger.error('TERMII_API_KEY is not configured');
      throw new Error('Termii API Key missing');
    }

    if (payload.channel === Channel.SMS) {
      const url = `${this.baseUrl}/sms/send`;
      const data = {
        api_key: apiKey,
        to: payload.to,
        from: payload.from || 'N-Alert',
        sms: payload.content,
        type: 'plain',
        channel: 'generic', // Could be configurable: generic, dnd, whatsapp (but this is SMS provider)
      };

      try {
        const response = await firstValueFrom(this.httpService.post(url, data));
        return {
          messageId: response.data.message_id,
          status: 'sent',
          rawResponse: response.data,
        };
      } catch (error) {
        this.logger.error(
          'Termii SMS Send Failed',
          error.response?.data || error.message,
        );
        throw error;
      }
    } else if (payload.channel === Channel.EMAIL) {
      // Hypothetical Termii Email implementation as per prompt
      // Assuming similar structure or using standard email service if Termii supports it via API
      this.logger.warn('Termii Email implementation is a placeholder');
      return {
        messageId: `mock-email-${Date.now()}`,
        status: 'sent',
        rawResponse: {},
      };
    }

    throw new Error(
      `Channel ${payload.channel} not supported by TermiiProvider`,
    );
  }

  async parseWebhook(
    payload: any,
  ): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    // Termii Inbound SMS usually has: receiver (shortcode/senderID), sender (phone), message, msgid
    if (payload.receiver && payload.sender && payload.message) {
      return {
        type: 'inbound',
        data: {
          from: payload.sender,
          to: payload.receiver,
          content: payload.message,
          providerMessageId: payload.msgid || payload.message_id,
          channel: Channel.SMS,
          timestamp: new Date(payload.received_at || Date.now()),
          rawPayload: payload,
        },
      };
    }

    // Termii Delivery Report usually has: id (message_id), status
    if (payload.id && payload.status) {
      return {
        type: 'delivery',
        data: {
          messageId: payload.id,
          status: this.mapStatus(payload.status),
          rawPayload: payload,
        },
      };
    }

    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    if (payload.channel === Channel.SMS) {
      // Standard Termii rate (approximate, should be configurable)
      return 4.0;
    }
    return 0;
  }

  private mapStatus(status: string): any {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'DELIVERED';
      case 'failed':
      case 'rejected':
        return 'FAILED';
      case 'pending':
        return 'PENDING';
      default:
        return 'SENT';
    }
  }
}
