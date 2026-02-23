import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { TermiiProvider } from '../providers/termii.provider';
import {
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks/termii')
export class TermiiWebhookController {
  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly termiiProvider: TermiiProvider,
  ) {}

  @Public()
  @Post('sms')
  @HttpCode(200)
  @ApiOperation({ summary: 'Termii SMS Webhook (Inbound & Delivery)' })
  async handleSmsWebhook(@Body() payload: any) {
    const parsed = await this.termiiProvider.parseWebhook(payload);
    if (!parsed) return { status: 'Ignored' };

    if (parsed.type === 'inbound') {
      await this.messagingEngine.handleInbound(parsed.data as InboundMessage);
    } else if (parsed.type === 'delivery') {
      await this.messagingEngine.updateDeliveryStatus(
        parsed.data as DeliveryReport,
      );
    }
    return { status: 'Received' };
  }
}
