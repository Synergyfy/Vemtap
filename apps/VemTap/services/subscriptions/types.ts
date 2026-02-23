export interface Subscription {
    id: string;
    businessId: string;
    planId: string;
    planName: string;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    billingPeriod?: 'monthly' | 'quarterly' | 'yearly';
    createdAt: string;
}

export interface SubscriptionCapabilities {
    visitorLimit: number;
    visitorsUsed: number;
    tagLimit: number;
    tagsUsed: number;
    smsLimit: number;
    smsUsed: number;
    emailLimit: number;
    emailUsed: number;
}

export interface SubscribeRequest {
    businessId: string;
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    paymentReference?: string;
}
