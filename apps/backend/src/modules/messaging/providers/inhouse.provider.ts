import { Injectable } from '@nestjs/common';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';

@Injectable()
export class InHouseProvider implements MessagingProvider {
  async sendMessage(payload: SendMessagePayload): Promise<ProviderResponse> {
    // In-house messaging doesn't need external delivery
    // It's already saved in our DB by the MessagingEngineService
    return {
      status: 'sent',
      messageId: `inhouse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      cost: 0,
      units: 0,
      reference: 'IN_HOUSE',
    };
  }

  estimateCost(payload: SendMessagePayload): number {
    return 0;
  }

  async parseWebhook(payload: any): Promise<{
    type: 'inbound' | 'delivery';
    data: InboundMessage | DeliveryReport;
  } | null> {
    return null;
  }
}
