export interface SubscriptionPlan {
    id: string;
    name: string;
    monthlyPrice: string;
    quarterlyPrice: string;
    yearlyPrice: string;
    currency: string;
    isFree: boolean;
    trialDurationDays: number;
    features: string[];
    smsCredits: number;
    emailCredits: number;
    whatsappCredits: number;
    teamMembersLimit: number;
    loyaltyLimit: number;
    tagsLimit: number;
    branchLimit: number;
    analyticsLevel: string;
    isActive: boolean;
    description: string;
    isPopular: boolean;
}

export interface Subscription {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    businessId: string;
    plan: SubscriptionPlan;
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    startDate: string;
    endDate: string;
    trialEndDate: string;
    status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial';
    paystackReference: string;
    paystackAuthorizationCode: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
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
    isTrial?: boolean;
}
