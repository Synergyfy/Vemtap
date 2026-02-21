import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Infobip, AuthType } from '@infobip-api/sdk';

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
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

    async sendSingle(from: string, to: string, text: string): Promise<string | undefined> {
        try {
            if (!this.client) {
                this.logger.warn('Infobip SMS client not configured. Simulating send.', { to, text });
                return `mock-sms-id-${Date.now()}`;
            }

            const response = await this.client.channels.sms.send({
                messages: [
                    {
                        destinations: [{ to }],
                        from,
                        text,
                    },
                ],
            });

            return response.data?.bulkId; // Or return message ID depending on Infobip schema
        } catch (error) {
            this.logger.error(`Failed to send SMS to ${to}`, error.stack);
            throw error;
        }
    }

    async sendBulk(from: string, messages: { to: string; text: string }[]): Promise<string | undefined> {
        try {
            if (!this.client) {
                this.logger.warn('Infobip SMS client not configured. Simulating bulk send.');
                return `mock-batch-id-${Date.now()}`;
            }

            const infobipMessages = messages.map(m => ({
                destinations: [{ to: m.to }],
                from,
                text: m.text,
            }));

            const response = await this.client.channels.sms.send({
                messages: infobipMessages,
            });

            return response.data?.bulkId;
        } catch (error) {
            this.logger.error('Failed to send bulk SMS', error.stack);
            throw error;
        }
    }
}
