
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
    permissionsConfiguredAt?: string | null;
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
