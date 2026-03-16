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

/**
 * Interface representing common fields in Twilio Webhook payloads.
 */
interface TwilioWebhookPayload {
  AccountSid: string;
  ApiVersion: string;
  From: string;
  To: string;
  SmsSid?: string;
  MessageSid?: string;
  Body?: string;
  MessageStatus?: 'queued' | 'failed' | 'sent' | 'delivered' | 'undelivered' | 'read';
  ErrorCode?: string;
  ErrorMessage?: string;
  [key: string]: any;
}

@Injectable()
export class TwilioProvider implements MessagingProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  private readonly client: twilio.Twilio;
  private readonly whatsappNumber: string;
  private readonly authToken: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    this.authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN') || '';
    this.whatsappNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    if (accountSid && this.authToken) {
      this.client = twilio(accountSid, this.authToken);
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
    } catch (error: any) {
      this.logger.error(`Twilio WhatsApp Send Failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async parseWebhook(payload: TwilioWebhookPayload): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    if (!payload) return null;

    // Twilio Inbound Message (SmsSid is provided for inbound, MessageSid for status callbacks)
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
          error: payload.ErrorMessage || payload.ErrorCode,
        } as DeliveryReport,
      };
    }

    return null;
  }

  /**
   * Validates if the request is actually from Twilio.
   * This is a security feature to prevent unauthorized webhook calls.
   */
  validateRequest(signature: string, url: string, params: Record<string, any>): boolean {
    if (!this.authToken) return false;
    try {
      return twilio.validateRequest(this.authToken, signature, url, params);
    } catch (error: any) {
      this.logger.error(`Webhook Validation Error: ${error.message}`);
      return false;
    }
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
