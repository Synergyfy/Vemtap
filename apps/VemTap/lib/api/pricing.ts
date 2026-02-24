
import { api } from '@/lib/api';

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

export const fetchPricingPlans = async (): Promise<PricingPlan[]> => {
    return await api.get('/plans?onlyActive=true');
};

export const updatePricingPlan = async (plan: PricingPlan): Promise<PricingPlan> => {
    return await api.patch(`/plans/admin/${plan.id}`, plan);
};

export const addPricingPlan = async (plan: Omit<PricingPlan, 'id'>): Promise<PricingPlan> => {
    return await api.post('/plans/admin', plan);
};

export const deletePricingPlan = async (id: string): Promise<void> => {
    await api.delete(`/plans/admin/${id}`);
};
