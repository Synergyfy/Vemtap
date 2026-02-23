import { Injectable } from '@nestjs/common';
import { Channel } from '../enums/channel.enum';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
} from '../interfaces/messaging-provider.interface';
import { TermiiProvider } from '../providers/termii.provider';

@Injectable()
export class ProviderRouterService {
  constructor(private readonly termiiProvider: TermiiProvider) {}

  public getProvider(channel: Channel): MessagingProvider {
    switch (channel) {
      case Channel.SMS:
      case Channel.EMAIL:
      case Channel.WHATSAPP: // Route WhatsApp to Termii
        return this.termiiProvider;
      default:
        throw new Error(`No provider found for channel ${channel}`);
    }
  }

  public async sendMessage(
    payload: SendMessagePayload,
  ): Promise<ProviderResponse> {
    const provider = this.getProvider(payload.channel);
    return provider.sendMessage(payload);
  }

  public async estimateCost(payload: SendMessagePayload): Promise<number> {
    const provider = this.getProvider(payload.channel);
    return provider.estimateCost(payload);
  }
}
