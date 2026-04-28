import { Injectable } from '@nestjs/common';
import { Channel } from '../enums/channel.enum';
import {
  MessagingProvider,
  SendMessagePayload,
  ProviderResponse,
} from '../interfaces/messaging-provider.interface';
import { TwilioProvider } from '../providers/twilio.provider';
import { BestBulkSmsProvider } from '../providers/bestbulksms.provider';
import { EmailProvider } from '../providers/email.provider';
import { InHouseProvider } from '../providers/inhouse.provider';

@Injectable()
export class ProviderRouterService {
  constructor(
    private readonly twilioProvider: TwilioProvider,
    private readonly bestBulkSmsProvider: BestBulkSmsProvider,
    private readonly emailProvider: EmailProvider,
    private readonly inHouseProvider: InHouseProvider,
  ) {}

  public getProvider(channel: Channel): MessagingProvider {
    switch (channel) {
      case Channel.SMS:
        return this.bestBulkSmsProvider;
      case Channel.WHATSAPP: // Route WhatsApp to Twilio
        return this.twilioProvider;
      case Channel.EMAIL:
        return this.emailProvider;
      case Channel.IN_HOUSE:
        return this.inHouseProvider;
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
