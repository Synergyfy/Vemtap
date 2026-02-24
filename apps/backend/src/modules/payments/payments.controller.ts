import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';

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
}
