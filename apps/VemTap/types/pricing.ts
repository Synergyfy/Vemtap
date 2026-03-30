
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
    teamMembersLimit: number;
    loyaltyEnabled: boolean;
    loyaltyLimit: number;
    branchesEnabled: boolean;
    branchLimit: number;
    analyticsEnabled: boolean;
    analyticsLevel: 'basic' | 'advanced' | 'none';
    catalogueEnabled: boolean;
    maxCatalogueItems: number;
    maxCatalogueCategories: number;
    maxCatalogueOffers: number;
    isActive: boolean;
    description: string;
    isPopular?: boolean;
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
