
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
    smsCredits: number;
    whatsappCredits: number;
    emailCredits: number;
    teamMembersLimit: number;
    loyaltyLimit: number;
    branchLimit: number;
    analyticsLevel: 'basic' | 'advanced' | 'none';
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
