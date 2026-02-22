import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Infobip, AuthType } from '@infobip-api/sdk';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Infobip;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = this.configService.get<string>('INFOBIP_BASE_URL');
    const apiKey = this.configService.get<string>('INFOBIP_API_KEY');

    if (baseUrl && apiKey) {
      this.client = new Infobip({
        baseUrl,
        authType: AuthType.ApiKey,
        apiKey,
      });
    }
  }

  async sendSingle(
    from: string,
    to: string,
    text: string,
  ): Promise<string | undefined> {
    try {
      if (!this.client) {
        this.logger.warn(
          'Infobip WhatsApp client not configured. Simulating WA.',
          { to, text },
        );
        return `mock-wa-id-${Date.now()}`;
      }

      const response = await this.client.channels.whatsapp.sendText({
        from,
        to,
        content: { text },
      });

      return response.data?.messageId;
    } catch (error) {
      this.logger.error(`Failed to send WA to ${to}`, error.stack);
      throw error;
    }
  }
}
