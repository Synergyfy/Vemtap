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
export class BestBulkSmsProvider implements MessagingProvider {
  private readonly logger = new Logger(BestBulkSmsProvider.name);
  private readonly baseUrl = 'https://bestbulksms.com.ng/api/v1/send_sms';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    const apiKey = this.configService.get<string>('BESTBULKSMS_API_KEY');

    if (!apiKey) {
      this.logger.error('BESTBULKSMS_API_KEY is not configured');
      throw new Error('BestBulkSMS API Key missing');
    }

    if (payload.channel !== Channel.SMS) {
      throw new Error(`Channel ${payload.channel} not supported by BestBulkSmsProvider (SMS only)`);
    }

    // BestBulkSMS parameters: api_key, sender, to, message, routing
    const data = {
      api_key: apiKey,
      sender: payload.from || 'VemTap', // Default sender ID
      to: payload.to,
      message: payload.content,
      routing: 2, // Default to DND (Corporate) route for better delivery in Nigeria
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.baseUrl, data),
      );

      if (response.data.status === 'success') {
        return {
          messageId: response.data.data?.message_id || null,
          status: 'sent',
          rawResponse: response.data,
        };
      } else {
        this.logger.error('BestBulkSMS SMS Send Failed', response.data);
        return {
          messageId: null,
          status: 'failed',
          rawResponse: response.data,
        };
      }
    } catch (error) {
      this.logger.error(
        'BestBulkSMS SMS Send Failed',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    if (!payload) return null;

    if (payload.message_id && payload.status) {
      return {
        type: 'delivery',
        data: {
          messageId: payload.message_id,
          status: this.mapStatus(payload.status),
          rawPayload: payload,
        },
      };
    }

    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    return 1.0;
  }

  private mapStatus(status: string): any {
    switch (status.toLowerCase()) {
      case 'success':
      case 'delivered':
      case 'sent':
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
