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
    automations: CapabilityLimit;
    analytics: {
      enabled: boolean;
      level: 'basic' | 'advanced' | 'none';
    };
    messaging: {
      enabled: boolean;
    };
    catalogueItems: CapabilityLimit;
    catalogueCategories: CapabilityLimit;
    catalogueOffers: CapabilityLimit;
    features: string[];
    credits: {
      sms: number;
      email: number;
      whatsapp: number;
      ai: number;
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
    catalogueEnabled: boolean;
    maxCatalogueItems: number;
    maxCatalogueCategories: number;
    maxCatalogueOffers: number;
    automationsEnabled: boolean;
    maxAutomations: number;
    isActive: boolean;
    description: string;
    isPopular: boolean;
    badge?: 'free' | 'silver' | 'gold' | 'platinum';
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
    status: 'active' | 'canceled' | 'expired' | 'pending' | 'trial' | 'trialing';
    paystackReference: string;
    paystackAuthorizationCode: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
}

// ---------------------------------------------------------------
// Subscription VAT / Tax system (see backend modules/subscriptions)
// ---------------------------------------------------------------

export type TaxType = 'percentage' | 'fixed';
export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface PlanTaxInfo {
    name: string;
    taxType: TaxType;
    rate: number;
    isEnabled: boolean;
}

export interface PlanPricingCycle {
    basePrice: number;
    taxAmount: number;
    totalPrice: number;
}

export interface PlanPricing {
    tax: PlanTaxInfo;
    monthly: PlanPricingCycle;
    quarterly: PlanPricingCycle;
    yearly: PlanPricingCycle;
}

export interface SubscriptionPlanTaxFields {
    monthlyTax: number;
    monthlyPriceWithTax: number;
    quarterlyTax: number;
    quarterlyPriceWithTax: number;
    yearlyTax: number;
    yearlyPriceWithTax: number;
    tax: PlanTaxInfo;
    pricing: PlanPricing;
}

export interface SubscriptionTaxConfig {
    id: string;
    name: string;
    taxType: TaxType;
    rate: number;
    isEnabled: boolean;
    isActive: boolean;
    changedById?: string | null;
    changeReason?: string | null;
    createdAt: string;
    updatedAt: string;
    changedBy?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    } | null;
}

export interface PricePreviewResponse {
    subtotal: number;
    taxAmount: number;
    total: number;
    taxRule: PlanTaxInfo & { id?: string };
    plan: Partial<SubscriptionPlanTaxFields & { id: string; name: string }>;
    addons?: Array<{ id: string; name: string; price: number }>;
    discount?: DiscountBreakdown | null;
}

// ---------------------------------------------------------------
// Subscription Coupon & Discount system (see backend modules/coupons)
// ---------------------------------------------------------------

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum CouponDuration {
    ONCE = 'ONCE',
    REPEATING = 'REPEATING',
    FOREVER = 'FOREVER',
}

export interface DiscountBreakdown {
    code: string;
    couponName: string;
    discountType: DiscountType;
    amount: number;
    duration: CouponDuration;
    discountAmount: number;
    originalPlanPrice: number;
    discountedPlanPrice: number;
}

export interface ValidatePromoCodeResponse {
    isValid: boolean;
    originalPlanPrice: number;
    discountAmount: number;
    discountedPlanPrice: number;
    addonsSubtotal: number;
    netSubtotal: number;
    taxAmount: number;
    total: number;
    taxRule: PlanTaxInfo & { id?: string };
    coupon: {
        id: string;
        name: string;
        discountType: DiscountType;
        amount: number;
        duration: CouponDuration;
    };
    promotionCode: {
        id: string;
        code: string;
        timesRedeemed: number;
        maxRedemptions?: number | null;
    };
}

export interface CouponItem {
    id: string;
    name: string;
    discountType: DiscountType;
    amount: number;
    currency: string;
    maxDiscountAmount?: number | null;
    minSubtotal?: number | null;
    duration: CouponDuration;
    durationInMonths?: number | null;
    applicablePlanIds: string[];
    applicableBillingPeriods: string[];
    isActive: boolean;
    createdAt: string;
    createdById?: string | null;
    promotionCodes?: PromoCodeItem[];
}

export interface PromoCodeItem {
    id: string;
    couponId: string;
    code: string;
    isActive: boolean;
    startsAt?: string | null;
    expiresAt?: string | null;
    maxRedemptions?: number | null;
    timesRedeemed: number;
    maxRedemptionsPerUser: number;
    firstTimeOnly: boolean;
    allowedBusinessIds: string[];
    createdAt: string;
    coupon?: CouponItem;
}

export interface CouponRedemptionItem {
    id: string;
    promotionCodeId: string;
    couponId: string;
    businessId?: string;
    userId?: string;
    subscriptionId?: string;
    paymentReference: string;
    planId: string;
    billingPeriod: BillingPeriod;
    originalAmount: number;
    discountAmount: number;
    taxAmount: number;
    finalAmount: number;
    currency: string;
    createdAt: string;
    coupon?: CouponItem;
    promotionCode?: PromoCodeItem;
    business?: { id: string; name: string } | null;
    user?: { id: string; firstName: string; lastName: string; email: string } | null;
}

export interface CouponStats {
    totalCoupons: number;
    activeCoupons: number;
    totalPromoCodes: number;
    activePromoCodes: number;
    totalRedemptions: number;
    totalDiscountAmountGiven: number;
    totalRevenueFromDiscountedSales: number;
}

export interface CreateCouponPayload {
    name: string;
    discountType: DiscountType;
    amount: number;
    currency?: string;
    maxDiscountAmount?: number;
    minSubtotal?: number;
    duration?: CouponDuration;
    durationInMonths?: number;
    applicablePlanIds?: string[];
    applicableBillingPeriods?: string[];
    isActive?: boolean;
}

export interface CreatePromoCodePayload {
    code: string;
    isActive?: boolean;
    startsAt?: string;
    expiresAt?: string;
    maxRedemptions?: number;
    maxRedemptionsPerUser?: number;
    firstTimeOnly?: boolean;
    allowedBusinessIds?: string[];
}

export interface UpdateSubscriptionTaxPayload {
    name?: string;
    taxType: TaxType;
    rate: number;
    isEnabled: boolean;
    changeReason?: string;
}

export interface ToggleSubscriptionTaxPayload {
    isEnabled: boolean;
    changeReason?: string;
}
