import { SubscriptionPlan as BaseSubscriptionPlan, Subscription as BaseSubscription, SubscriptionCapabilities as BaseSubscriptionCapabilities } from '@/types/subscriptions';

export type SubscriptionPlan = BaseSubscriptionPlan;
export type Subscription = BaseSubscription;
export type SubscriptionCapabilities = BaseSubscriptionCapabilities;

export interface SubscribeRequest {
    businessId?: string;
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    paymentReference?: string;
    isTrial?: boolean;
    addonIds?: string[];
    addonQuantities?: number[];
    promoCode?: string;
}
