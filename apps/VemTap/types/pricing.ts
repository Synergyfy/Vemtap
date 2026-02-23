
export interface PricingPlan {
    id: string;
    name: string;
    monthlyPrice: number;
    quarterlyPrice: number;
    yearlyPrice: number;
    currency: string;
    isFree: boolean;
    freeDurationDays: number;
    teamMembersLimit: number;
    loyaltyLimit: number;
    tagsLimit: number;
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
