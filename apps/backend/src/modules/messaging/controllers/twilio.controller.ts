import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { TwilioProvider } from '../providers/twilio.provider';

@ApiTags('Messaging Webhooks')
@Controller('messaging/webhook/twilio')
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly twilioProvider: TwilioProvider,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Twilio WhatsApp webhooks' })
  async handleWebhook(@Body() payload: any) {
    this.logger.log('Received Twilio webhook');
    
    const parsed = await this.twilioProvider.parseWebhook(payload);
    if (!parsed) return { status: 'ignored' };

    if (parsed.type === 'inbound') {
      await this.messagingEngine.handleInbound(parsed.data as any);
    } else if (parsed.type === 'delivery') {
      await this.messagingEngine.handleDeliveryReport(parsed.data as any);
    }

    return { status: 'success' };
  }
}
