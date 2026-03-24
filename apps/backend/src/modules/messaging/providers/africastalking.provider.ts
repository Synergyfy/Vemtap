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
export class AfricaTalkingProvider implements MessagingProvider {
  private readonly logger = new Logger(AfricaTalkingProvider.name);
  private readonly baseUrl =
    'https://api.africastalking.com/version1/messaging/bulk';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
    const username = this.configService.get<string>('AFRICASTALKING_USERNAME');

    if (!apiKey || !username) {
      this.logger.error('AfricaTalking credentials are not configured');
      throw new Error('AfricaTalking credentials missing');
    }

    if (payload.channel !== Channel.SMS) {
      throw new Error(
        `Channel ${payload.channel} not supported by AfricaTalkingProvider (SMS only for now)`,
      );
    }

    const data = {
      username: username,
      message: payload.content,
      senderId: payload.from || undefined, // Africa's Talking uses senderId, if not provided it uses default
      phoneNumbers: [payload.to],
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.baseUrl, data, {
          headers: {
            apiKey: apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }),
      );

      // Africa's Talking response for SMS contains SMSMessageData -> Recipients array
      const messageData = response.data.SMSMessageData;
      const recipient = messageData?.Recipients?.[0];

      if (
        recipient &&
        (recipient.status === 'Success' || recipient.status === 'Sent')
      ) {
        return {
          messageId: recipient.messageId,
          status: 'sent',
          rawResponse: response.data,
        };
      } else {
        this.logger.error('AfricaTalking SMS Send Failed', response.data);
        return {
          messageId: recipient?.messageId || null,
          status: 'failed',
          rawResponse: response.data,
        };
      }
    } catch (error) {
      this.logger.error(
        'AfricaTalking SMS Send Failed',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    // Basic implementation for Africa's Talking webhooks
    // Africa's Talking uses form-data for webhooks usually, or JSON depending on config
    if (!payload) return null;

    // Delivery Report
    if (payload.id && payload.status && payload.phoneNumber) {
      return {
        type: 'delivery',
        data: {
          messageId: payload.id,
          status: this.mapStatus(payload.status),
          rawPayload: payload,
        },
      };
    }

    // Inbound Message
    if (payload.from && payload.to && payload.text) {
      return {
        type: 'inbound',
        data: {
          from: payload.from,
          to: payload.to,
          content: payload.text,
          providerMessageId: payload.id || payload.linkId,
          channel: Channel.SMS,
          timestamp: new Date(),
          rawPayload: payload,
        },
      };
    }

    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    // Placeholder cost estimation
    return 1.0;
  }

  private mapStatus(status: string): any {
    switch (status.toLowerCase()) {
      case 'success':
      case 'sent':
      case 'delivered':
        return 'DELIVERED';
      case 'failed':
      case 'rejected':
        return 'FAILED';
      case 'buffered':
        return 'PENDING';
      default:
        return 'SENT';
    }
  }
}
