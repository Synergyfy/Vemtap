import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Infobip, AuthType } from '@infobip-api/sdk';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
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

    async sendSingle(from: string, to: string, subject: string, text: string, html?: string): Promise<string | undefined> {
        try {
            if (!this.client) {
                this.logger.warn('Infobip Email client not configured. Simulating Email.', { to, subject });
                return `mock-email-id-${Date.now()}`;
            }

            const response = await this.client.channels.email.send({
                from,
                to,
                subject,
                text,
                html,
            });

            return response.data?.messages?.[0]?.messageId;
        } catch (error) {
            this.logger.error(`Failed to send Email to ${to}`, error.stack);
            throw error;
        }
    }
}
