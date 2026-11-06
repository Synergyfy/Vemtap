
export interface PricingPlan {
    id: string;
    name: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    features: string[];
    currency: string;
    isFree: boolean;
    trialDurationDays: number;
    freeDurationDays?: number;
    messagingEnabled: boolean;
    smsCredits: number;
    whatsappCredits: number;
    emailCredits: number;
    teamMembersEnabled: boolean;
    teamMembersLimit: number | null;
    loyaltyEnabled: boolean;
    loyaltyLimit: number | null;
    branchesEnabled: boolean;
    branchLimit: number | null;
    analyticsEnabled: boolean;
    analyticsLevel: 'basic' | 'advanced' | 'none';
    catalogueEnabled: boolean;
    maxCatalogueItems: number | null;
    maxCatalogueCategories: number | null;
    maxCatalogueOffers: number | null;
    automationsEnabled: boolean;
    maxAutomations: number | null;
    isActive: boolean;
    description: string;
    isPopular?: boolean;
    qrThrivePlanId?: string;
    inventoryEnabled?: boolean;
    inventoryLimit?: number | null;
    posEnabled?: boolean;
    posTerminalLimit?: number | null;
    visitorsEnabled?: boolean;
    inAppChatEnabled?: boolean;
    formsEnabled?: boolean;
    formsLimit?: number | null;
    businessQrEnabled?: boolean;
    marketingKitEnabled?: boolean;
    marketingKitLimit?: number | null;
    discoveryEnabled?: boolean;
    staffRolesEnabled?: boolean;
    staffRolesLimit?: number | null;
    activityLogEnabled?: boolean;
    qrCodesEnabled?: boolean;
    qrCodesLimit?: number | null;
    aiCopilotEnabled?: boolean;
    aiCredits?: number | null;
    permissionsConfiguredAt?: string | null;
    badge?: 'free' | 'silver' | 'gold' | 'platinum';
    autoFeatureDeals?: boolean;
    // Tax-aware pricing returned by GET /plans (VAT system)
    monthlyTax?: number;
    monthlyPriceWithTax?: number;
    quarterlyTax?: number;
    quarterlyPriceWithTax?: number;
    yearlyTax?: number;
    yearlyPriceWithTax?: number;
    tax?: {
        name: string;
        taxType: 'percentage' | 'fixed';
        rate: number;
        isEnabled: boolean;
    };
    pricing?: {
        tax: { name: string; taxType: 'percentage' | 'fixed'; rate: number; isEnabled: boolean };
        monthly: { basePrice: number; taxAmount: number; totalPrice: number };
        quarterly: { basePrice: number; taxAmount: number; totalPrice: number };
        yearly: { basePrice: number; taxAmount: number; totalPrice: number };
    };
}

export interface HardwareOption {
    id: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    status: 'active' | 'inactive';
    color: string;
    icon: string;
    desc: string;
    unit: string;
    features: string[];
}
