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
export class WapsChatProvider implements MessagingProvider {
  private readonly logger = new Logger(WapsChatProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // WapsChat config
    this.baseUrl =
      this.configService.get<string>('WAPSCHAT_BASE_URL') ||
      'https://wapschat.com';
    this.apiKey = this.configService.get<string>('WAPSCHAT_API_KEY') || '';
  }

  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    if (payload.channel !== Channel.WHATSAPP) {
      throw new Error(
        `Channel ${payload.channel} not supported by WapsChatProvider`,
      );
    }

    const url = `${this.baseUrl}/api/send-message`;
    const data: any = {
      api_key: this.apiKey,
      device: payload.from, // Assuming 'from' carries the session/device ID
      phone: payload.to,
      message: payload.content,
    };

    if (payload.mediaUrl) {
      data.media_url = payload.mediaUrl;
      // Depending on API, might need a different endpoint or field
    }

    try {
      const response = await firstValueFrom(this.httpService.post(url, data));
      // WapsChat response structure check
      return {
        messageId: response.data.message_id || `waps-${Date.now()}`,
        status: 'queued', // WhatsApp usually queues first
        rawResponse: response.data,
      };
    } catch (error) {
      this.logger.error(
        'WapsChat Send Failed',
        error.response?.data || error.message,
      );
      return {
        messageId: null,
        status: 'failed',
        rawResponse: error.response?.data,
      };
    }
  }

  async parseWebhook(
    payload: any,
  ): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    // WapsChat Webhook Structure
    // "Identify customer by phone", "Map device/session -> business"
    // Payload likely has: device, phone, message, type (text/image)
    if (payload.type === 'message' || payload.message) {
      return {
        type: 'inbound',
        data: {
          from: payload.phone || payload.sender,
          to: payload.device || payload.session_id, // The business session
          content: payload.message?.text || payload.message || '',
          providerMessageId: payload.id || payload.message_id,
          channel: Channel.WHATSAPP,
          timestamp: new Date(),
          rawPayload: payload,
        },
      };
    }

    // Delivery report
    if (payload.type === 'status' || payload.status) {
      return {
        type: 'delivery',
        data: {
          messageId: payload.id || payload.message_id,
          status: this.mapStatus(payload.status),
          rawPayload: payload,
        },
      };
    }

    return null;
  }

  estimateCost(payload: SendMessagePayload): number {
    return 8.0; // Approx cost
  }

  private mapStatus(status: string): any {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'read':
        return 'DELIVERED';
      case 'sent':
        return 'SENT';
      case 'failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }
}
