export interface CapabilityLimit {
  enabled: boolean;
  limit: number | 'unlimited';
  used: number;
  remaining: number | 'unlimited';
}

export interface SubscriptionCapabilities {
  plan: string;
  isActive: boolean;
  isTrial: boolean;
  capabilities: {
    teamMembers: CapabilityLimit;
    tags: CapabilityLimit;
    loyaltyPrograms: CapabilityLimit;
    branches: CapabilityLimit;
    analytics: {
      enabled: boolean;
      level: 'basic' | 'advanced' | 'none';
    };
    messaging: {
      enabled: boolean;
    };
    features: string[];
    credits: {
      sms: number;
      email: number;
      whatsapp: number;
    };
  };
}

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
