export interface SubscriptionPlan {
    id: string;
    name: string;
    monthlyPrice: string;
    quarterlyPrice: string;
    yearlyPrice: string;
    currency: string;
    isFree: boolean;
    trialDurationDays: number;
    freeDurationDays?: number;
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
    status: 'active' | 'cancelled' | 'expired' | 'pending' | 'trial' | 'trialing';
    paystackReference: string;
    paystackAuthorizationCode: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
}

export interface SubscriptionCapabilities {
    plan: string;
    isActive: boolean;
    isTrial: boolean;
    capabilities: {
        teamMembers: {
            limit: number;
            used: number;
            remaining: number;
        };
        tags: {
            limit: number;
            used: number;
            remaining: number;
        };
        loyaltyPrograms: {
            limit: number;
            used: number;
            remaining: number;
        };
        branches: {
            limit: number;
            used: number;
            remaining: number;
        };
        analytics: string;
        features: string[];
        credits: {
            sms: number;
            email: number;
            whatsapp: number;
        };
    };
}

export interface SubscribeRequest {
    businessId?: string;
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    paymentReference?: string;
    isTrial?: boolean;
}
