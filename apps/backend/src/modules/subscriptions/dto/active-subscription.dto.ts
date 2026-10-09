import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Subscription } from '../entities/subscription.entity';

export class SubscriptionPlanSummaryDto {
  @ApiProperty({ example: 'uuid-of-plan' })
  id: string;

  @ApiProperty({ example: 'Professional' })
  name: string;

  @ApiProperty({ example: 15000 })
  monthlyPrice: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ example: false })
  isFree: boolean;

  @ApiProperty({ example: 30, nullable: true })
  trialDurationDays: number | null;
}

/**
 * Additive view over the raw subscription returned by
 * `GET /subscriptions/active`: every original field is preserved and the trial
 * fields the app needs (`isTrial`, `trialEndsAt`) plus a plan summary are
 * derived here. Do not move this mapping into `activeSubscription()` — internal
 * callers and guards depend on the raw entity.
 */
export class ActiveSubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true })
  businessId: string;

  @ApiProperty({ nullable: true })
  planId: string;

  @ApiProperty({ example: 'monthly', nullable: true })
  billingPeriod: string | null;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: '2026-10-15T00:00:00.000Z', nullable: true })
  trialEndsAt: Date | null;

  @ApiProperty({
    example: 'active',
    enum: ['active', 'canceled', 'expired', 'trial'],
  })
  status: string;

  @ApiProperty({ example: false })
  isTrial: boolean;

  @ApiProperty({ nullable: true })
  paystackReference: string | null;

  @ApiProperty({ nullable: true })
  paystackAuthorizationCode: string | null;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: SubscriptionPlanSummaryDto, nullable: true })
  plan: SubscriptionPlanSummaryDto | null;
}

export function toActiveSubscriptionDto(
  subscription: Subscription | null,
): ActiveSubscriptionDto | null {
  if (!subscription) return null;

  return {
    id: subscription.id,
    businessId: subscription.businessId,
    planId: subscription.planId,
    billingPeriod: subscription.billingPeriod ?? null,
    startDate: subscription.startDate,
    endDate: subscription.endDate ?? null,
    trialEndsAt: subscription.trialEndDate ?? null,
    status: subscription.status,
    isTrial: subscription.status === 'trial',
    paystackReference: subscription.paystackReference ?? null,
    paystackAuthorizationCode: subscription.paystackAuthorizationCode ?? null,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
    plan: subscription.plan
      ? {
          id: subscription.plan.id,
          name: subscription.plan.name,
          monthlyPrice: Number(subscription.plan.monthlyPrice ?? 0),
          currency: subscription.plan.currency,
          isFree: subscription.plan.isFree,
          trialDurationDays: subscription.plan.trialDurationDays ?? null,
        }
      : null,
  };
}
