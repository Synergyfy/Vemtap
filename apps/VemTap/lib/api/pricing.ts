import { api } from '@/lib/api';
import { PricingPlan } from '@/types/pricing';

type CreatePricingPlanInput = Omit<PricingPlan, 'id' | 'quarterlyPrice' | 'yearlyPrice'>;
type UpdatePricingPlanInput = CreatePricingPlanInput & { id: string };

const toNumber = (value: unknown, fallback = 0): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const normalizePlan = (raw: any): PricingPlan => ({
    id: String(raw?.id ?? raw?._id ?? raw?.planId ?? raw?.code ?? raw?.planCode ?? ''),
    name: String(raw?.name ?? ''),
    monthlyPrice: toNumber(raw?.monthlyPrice),
    quarterlyPrice: toNumber(raw?.quarterlyPrice),
    yearlyPrice: toNumber(raw?.yearlyPrice),
    features: Array.isArray(raw?.features) ? raw.features.map((f: unknown) => String(f)) : [],
    currency: String(raw?.currency ?? 'NGN'),
    isFree: Boolean(raw?.isFree),
    trialDurationDays: toNumber(raw?.trialDurationDays, 0),
    smsCredits: toNumber(raw?.smsCredits),
    whatsappCredits: toNumber(raw?.whatsappCredits),
    emailCredits: toNumber(raw?.emailCredits),
    messagingEnabled: Boolean(raw?.messagingEnabled),
    teamMembersEnabled: Boolean(raw?.teamMembersEnabled),
    teamMembersLimit: toNumber(raw?.teamMembersLimit),
    loyaltyEnabled: Boolean(raw?.loyaltyEnabled),
    loyaltyLimit: toNumber(raw?.loyaltyLimit),
    branchesEnabled: Boolean(raw?.branchesEnabled),
    branchLimit: toNumber(raw?.branchLimit),
    analyticsEnabled: Boolean(raw?.analyticsEnabled),
    analyticsLevel: raw?.analyticsLevel === 'advanced' || raw?.analyticsLevel === 'none' ? raw.analyticsLevel : 'basic',
    catalogueEnabled: Boolean(raw?.catalogueEnabled),
    maxCatalogueItems: toNumber(raw?.maxCatalogueItems),
    maxCatalogueCategories: toNumber(raw?.maxCatalogueCategories),
    maxCatalogueOffers: toNumber(raw?.maxCatalogueOffers),
    automationsEnabled: Boolean(raw?.automationsEnabled),
    maxAutomations: toNumber(raw?.maxAutomations),
    isActive: raw?.isActive ?? true,
    description: String(raw?.description ?? ''),
    isPopular: Boolean(raw?.isPopular),
});

const toPlanPayload = (plan: Partial<PricingPlan>) => {
    const payload: any = {};
    
    // Explicitly handle fields if they exist in the input object
    const fields: (keyof PricingPlan)[] = [
        'name', 'monthlyPrice', 'features', 'currency', 'isFree',
        'trialDurationDays', 'smsCredits', 'whatsappCredits', 'emailCredits',
        'messagingEnabled', 'teamMembersEnabled', 'teamMembersLimit',
        'loyaltyEnabled', 'loyaltyLimit', 'branchesEnabled', 'branchLimit',
        'analyticsEnabled', 'analyticsLevel', 'catalogueEnabled',
        'maxCatalogueItems', 'maxCatalogueCategories', 'maxCatalogueOffers',
        'automationsEnabled', 'maxAutomations',
        'isActive', 'description', 'isPopular'
    ];

    fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(plan, field)) {
            const val = plan[field];
            if (field === 'features' && Array.isArray(val)) {
                payload[field] = val;
            } else if (typeof val === 'boolean') {
                payload[field] = val;
            } else if (field === 'analyticsLevel' || field === 'name' || field === 'currency' || field === 'description') {
                payload[field] = val;
            } else {
                payload[field] = toNumber(val);
            }
        }
    });

    return payload;
};

export const fetchPricingPlans = async (): Promise<PricingPlan[]> => {
    const response = await api.get('/plans?onlyActive=true');
    return Array.isArray(response) ? response.map(normalizePlan) : [];
};

export const fetchAdminPricingPlans = async (): Promise<PricingPlan[]> => {
    const response = await api.get('/plans');
    return Array.isArray(response) ? response.map(normalizePlan) : [];
};

export const addPricingPlan = async (plan: CreatePricingPlanInput): Promise<PricingPlan> => {
    const response = await api.post('/plans/admin', toPlanPayload(plan));
    return normalizePlan(response);
};

export const updatePricingPlan = async (plan: Partial<PricingPlan> & { id: string }): Promise<PricingPlan> => {
    const { id, ...data } = plan;
    const response = await api.patch(`/plans/admin/${id}`, toPlanPayload(data));
    return normalizePlan(response);
};

export const deletePricingPlan = async (id: string): Promise<void> => {
    await api.delete(`/plans/admin/${id}`);
};
