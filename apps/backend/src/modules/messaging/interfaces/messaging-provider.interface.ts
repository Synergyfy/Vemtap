import { Channel } from '../enums/channel.enum';

export interface SendMessagePayload {
  to: string;
  from?: string; // sender ID or business name
  content: string;
  channel: Channel;
  mediaUrl?: string; // for whatsapp
}

export interface ProviderResponse {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
  rawResponse?: any;
}

export interface InboundMessage {
  from: string;
  to: string; // The business identifier (phone/email)
  content: string;
  providerMessageId: string;
  channel: Channel;
  timestamp: Date;
  rawPayload: any;
}

export interface DeliveryReport {
  messageId: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING' | 'SENT' | 'REJECTED';
  rawPayload: any;
}

export interface MessagingProvider {
  sendMessage(payload: SendMessagePayload): Promise<ProviderResponse>;
  /**
   * Parses a webhook payload and identifies if it is an inbound message or delivery report.
   * Returns the parsed object or null if it's irrelevant/unparseable.
   */
  parseWebhook(payload: any): Promise<{ type: 'inbound' | 'delivery'; data: InboundMessage | DeliveryReport } | null>;
  estimateCost(payload: SendMessagePayload): number;
}
