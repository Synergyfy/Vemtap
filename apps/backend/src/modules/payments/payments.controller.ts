import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SkipSubscriptionCheck } from '../subscriptions/decorators/skip-subscription-check.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BillingPeriod } from '../subscriptions/entities/subscription.entity';
import { PaymentPurpose } from './entities/payment.entity';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @SkipSubscriptionCheck()
  @ApiOperation({ summary: 'Verify a payment reference' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  async verify(@Param('reference') reference: string) {
    const result = await this.paymentsService.verifyTransaction(reference);
    return {
      success: result?.status === 'success',
      status: result?.status ?? 'failed',
      amount: result?.amount ?? 0,
    };
  }

  @Public()
  @Post('webhook')
  @SkipSubscriptionCheck()
  @ApiOperation({ summary: 'Paystack Webhook' })
  async webhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    const rawBody =
      (req as any).rawBody ?? (req as any).raw?.rawBody ?? undefined;

    const isValid = this.paymentsService.verifyWebhookSignature(
      signature,
      rawBody ?? JSON.stringify(payload),
    );
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Process the event. Any processing failure must still return 200 so
    // Paystack does not consider the webhook failed.
    await this.handleWebhookEvent(payload);

    return { status: 'success' };
  }

  private async handleWebhookEvent(payload: any): Promise<void> {
    const event = payload?.event;
    const data = payload?.data;
    if (!event || !data) return;

    if (event === 'charge.success') {
      const reference = data.reference;
      if (!reference) return;

      try {
        const payment = await this.paymentsService.findByReference(reference);
        if (!payment) {
          // No pending subscription intent for this reference (legacy client
          // flows, credit top-ups, or add-on purchases) — nothing to activate.
          return;
        }

        const isSubscriptionIntent =
          payment.purpose === PaymentPurpose.SUBSCRIPTION ||
          payment.purpose === PaymentPurpose.PLAN_WITH_ADDONS;
        if (!isSubscriptionIntent) {
          // Credit top-ups / add-ons / orders are handled by their own flows;
          // never route their `charge.success` into the subscription engine.
          return;
        }

        const meta: any = payment.metadata || {};

        const planId = meta?.planId;
        const businessId = meta?.businessId;
        const billingPeriod = (meta?.billingPeriod ||
          BillingPeriod.MONTHLY) as BillingPeriod;
        const isTrial = !!meta?.isTrial;

        if (!planId || !businessId) {
          this.logger.warn(
            `charge.success with no planId/businessId for reference ${reference}; skipping activation`,
          );
          return;
        }

        // Idempotent: a duplicate webhook for an already-processed reference
        // simply returns the existing subscription.
        await this.subscriptionsService.subscribe({
          planId,
          businessId,
          billingPeriod,
          isTrial,
          paymentReference: reference,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to activate subscription from webhook for ${reference}: ${err.message}`,
          err.stack,
        );
      }
      return;
    }

    if (event === 'bank.transfer.rejected') {
      const reference = data.reference;
      if (!reference) return;
      this.logger.warn(
        `bank.transfer.rejected for reference ${reference}: ${data.message || 'no message'}`,
      );
    }
  }
}
