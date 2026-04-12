import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { IntegrationApiKeyGuard } from './guards/integration-api-key.guard';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Internal Integration')
@ApiHeader({
  name: 'x-vemtap-api-key',
  description: 'Secure API key for QR-Thrive callback',
})
@Controller('integration/qr-thrive')
@UseGuards(IntegrationApiKeyGuard)
@Public() // Bypasses normal AuthGuard but kept under IntegrationApiKeyGuard
export class QrThriveCallbackController {
  private readonly logger = new Logger(QrThriveCallbackController.name);

  @Post('callback')
  @ApiOperation({ summary: 'Handle callbacks/webhooks from QR-Thrive' })
  async handleCallback(@Body() payload: any) {
    this.logger.log(`Received callback from QR-Thrive: ${JSON.stringify(payload)}`);

    // TODO: Implement specific logic for different event types
    // For now, we just acknowledge receipt

    return { status: 'success', message: 'Callback received' };
  }
}
