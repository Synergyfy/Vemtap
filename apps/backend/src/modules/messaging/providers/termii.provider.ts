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
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl =
      this.configService.get<string>('TERMII_BASE_URL') ||
      'https://v3.api.termii.com/api';
  }

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
        channel: 'generic',
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
    } else if (payload.channel === Channel.WHATSAPP) {
      // Termii WhatsApp Implementation
      const url = `${this.baseUrl}/whatsapp/send`;
      const data: any = {
        api_key: apiKey,
        to: payload.to,
        from: payload.from || 'N-Alert', // Should be a registered WhatsApp Sender ID
        sms: payload.content,
        channel: 'whatsapp',
        type: 'plain',
      };

      if (payload.mediaUrl) {
        data.media = { url: payload.mediaUrl };
      }

      try {
        const response = await firstValueFrom(this.httpService.post(url, data));
        return {
          messageId: response.data.message_id,
          status: 'queued',
          rawResponse: response.data,
        };
      } catch (error) {
        this.logger.error(
          'Termii WhatsApp Send Failed',
          error.response?.data || error.message,
        );
        throw error;
      }
    }

    throw new Error(
      `Channel ${payload.channel} not supported by TermiiProvider`,
    );
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    if (!payload) return null;

    // Termii Inbound SMS/WhatsApp usually has: receiver (shortcode/senderID), sender (phone), message, msgid
    if (payload.receiver && payload.sender && payload.message) {
      // Try to detect channel if possible, else default based on context or assume SMS/Unified
      // If we are strictly using Termii for everything, maybe we can inspect 'receiver' to know if it's a WhatsApp ID
      let channel = Channel.SMS;
      if (payload.channel === 'whatsapp' || payload.type === 'whatsapp') {
        channel = Channel.WHATSAPP;
      }

      return {
        type: 'inbound',
        data: {
          from: payload.sender,
          to: payload.receiver,
          content: payload.message,
          providerMessageId: payload.msgid || payload.message_id,
          channel: channel,
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
      return 4.0;
    } else if (payload.channel === Channel.WHATSAPP) {
      return 15.0; // Higher cost for WhatsApp
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
