import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagingEngineService } from '../services/messaging-engine.service';
import { WapsChatProvider } from '../providers/wapschat.provider';
import {
  InboundMessage,
  DeliveryReport,
} from '../interfaces/messaging-provider.interface';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('webhooks/wapschat')
export class WapsChatWebhookController {
  constructor(
    private readonly messagingEngine: MessagingEngineService,
    private readonly wapsChatProvider: WapsChatProvider,
  ) {}

  @Public()
  @Post('whatsapp')
  @HttpCode(200)
  @ApiOperation({ summary: 'WapsChat WhatsApp Webhook' })
  async handleWhatsappWebhook(@Body() payload: any) {
    const parsed = await this.wapsChatProvider.parseWebhook(payload);
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
