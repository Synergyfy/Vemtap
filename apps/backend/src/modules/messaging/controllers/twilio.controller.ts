import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Headers, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
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
  @ApiOperation({ summary: 'Handle Twilio WhatsApp webhooks with signature validation' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ) {
    // 1. Security Check: Validate Twilio Signature
    // In production, you should always validate that the request is coming from Twilio.
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    
    // Note: Twilio validates using the exact URL and the POST parameters.
    // Some environments (like behind a proxy/load balancer) might need careful URL construction.
    const isValid = this.twilioProvider.validateRequest(signature, url, payload);
    
    if (!isValid && process.env.NODE_ENV === 'production') {
      this.logger.warn(`Invalid Twilio signature received for ${url}`);
      throw new UnauthorizedException('Invalid signature');
    }

    if (!payload) {
      this.logger.warn('Received empty payload from Twilio webhook');
      return { status: 'ignored' };
    }

    this.logger.log(`Received Twilio webhook: ${payload.SmsSid || payload.MessageSid}`);

    
    // 2. Process Webhook
    const parsed = await this.twilioProvider.parseWebhook(payload);
    if (!parsed) return { status: 'ignored' };

    try {
      if (parsed.type === 'inbound') {
        await this.messagingEngine.handleInbound(parsed.data as any);
      } else if (parsed.type === 'delivery') {
        await this.messagingEngine.handleDeliveryReport(parsed.data as any);
      }
      return { status: 'success' };
    } catch (error: any) {
      this.logger.error(`Failed to process Twilio webhook: ${error.message}`, error.stack);
      // We still return 200 to Twilio to avoid retries if it's an internal logic error,
      // but you might want to adjust this based on your retry strategy.
      return { status: 'error', message: error.message };
    }
  }
}
