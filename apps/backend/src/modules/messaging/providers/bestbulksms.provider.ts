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

interface BestBulkSmsResponse {
  ok: boolean;
  message: string;
  reference?: string;
  sms_message_id?: number;
  total_cost?: number;
  units?: number;
  status?: string;
}

@Injectable()
export class BestBulkSmsProvider implements MessagingProvider {
  private readonly logger = new Logger(BestBulkSmsProvider.name);
  private readonly baseUrl = 'https://bestbulksms.com.ng/api/sms/send';

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
      throw new Error(
        `Channel ${payload.channel} not supported by BestBulkSmsProvider (SMS only)`,
      );
    }

    // BestBulkSMS parameters for v1/send: to, sender_id, message
    // Forcing 'VEMTAP' as requested to test carrier delivery
    const senderId = 'VEMTAP';

    this.logger.log(
      `Sending SMS to ${payload.to} using Sender ID: ${senderId}`,
    );

    const data = {
      sender_id: senderId,
      to: payload.to,
      message: payload.content,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<BestBulkSmsResponse>(this.baseUrl, data, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const responseData = response.data;

      if (responseData.ok === true) {
        return {
          messageId:
            responseData.sms_message_id?.toString() ||
            responseData.reference ||
            null,
          status: responseData.message === 'Queued' ? 'queued' : 'sent',
          cost: responseData.total_cost,
          units: responseData.units,
          reference: responseData.reference,
          rawResponse: responseData,
        };
      } else {
        this.logger.error('BestBulkSMS SMS Send Failed', responseData);
        return {
          messageId: null,
          status: 'failed',
          rawResponse: responseData,
        };
      }
    } catch (error: any) {
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
