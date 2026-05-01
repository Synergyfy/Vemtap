import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { IntegrationApiKeyGuard } from './guards/integration-api-key.guard';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';

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

  @Public()
  @Post('callback')
  @ApiOperation({ summary: 'Handle incoming callback from QR-Thrive' })
  async handleCallback(@Body() payload: any) {
    const { event, data } = payload;
    this.logger.log(
      `Received callback event "${event}" from QR-Thrive: ${JSON.stringify(data)}`,
    );

    switch (event) {
      case 'user.synced':
        this.logger.log(
          `User ${data.email} synchronization confirmed by QR-Thrive.`,
        );
        break;
      case 'scan.milestone':
        this.logger.log(
          `QR Code ${data.qrCodeId} reached scan milestone: ${data.milestone}`,
        );
        break;
      case 'branding.update':
        this.logger.log(
          `Branding update received for organization: ${data.orgId}`,
        );
        break;
      default:
        this.logger.warn(
          `Unhandled integration event from QR-Thrive: ${event}`,
        );
    }

    return { status: 'success', message: 'Callback processed' };
  }
}
