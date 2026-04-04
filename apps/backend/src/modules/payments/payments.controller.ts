import { Controller, Get, Post, Body, Headers, Param, Query, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('verify/:reference')
  @SkipSubscriptionCheck()
  @ApiOperation({ summary: 'Verify a payment reference' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verify(@Param('reference') reference: string) {
    const isValid = await this.paymentsService.verifyTransaction(reference);
    return { success: isValid };
  }

  @Public()
  @Post('webhook')
  @SkipSubscriptionCheck()
  @ApiOperation({ summary: 'Paystack Webhook' })
  async webhook(@Body() payload: any, @Headers('x-paystack-signature') signature: string) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    const isValid = this.paymentsService.verifyWebhookSignature(signature, payload);
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Process the event
    // For now, we just log it. In a real scenario, we'd handle charge.success, charge.failed, etc.
    console.log(`Received Paystack Webhook: ${payload.event}`);
    
    return { status: 'success' };
  }
}
