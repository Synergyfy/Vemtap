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
    trialDurationDays: toNumber(raw?.trialDurationDays, 30),
    smsCredits: toNumber(raw?.smsCredits),
    whatsappCredits: toNumber(raw?.whatsappCredits),
    emailCredits: toNumber(raw?.emailCredits),
    teamMembersLimit: toNumber(raw?.teamMembersLimit),
    loyaltyLimit: toNumber(raw?.loyaltyLimit),
    tagsLimit: toNumber(raw?.tagsLimit),
    branchLimit: toNumber(raw?.branchLimit),
    analyticsLevel: raw?.analyticsLevel === 'advanced' || raw?.analyticsLevel === 'none' ? raw.analyticsLevel : 'basic',
    isActive: raw?.isActive ?? true,
    description: String(raw?.description ?? ''),
    isPopular: Boolean(raw?.isPopular),
});

const toPlanPayload = (plan: CreatePricingPlanInput) => ({
    name: plan.name,
    monthlyPrice: toNumber(plan.monthlyPrice),
    features: Array.isArray(plan.features) ? plan.features : [],
    currency: plan.currency || 'NGN',
    isFree: Boolean(plan.isFree),
    trialDurationDays: toNumber(plan.trialDurationDays, 30),
    smsCredits: toNumber(plan.smsCredits),
    whatsappCredits: toNumber(plan.whatsappCredits),
    emailCredits: toNumber(plan.emailCredits),
    teamMembersLimit: toNumber(plan.teamMembersLimit),
    loyaltyLimit: toNumber(plan.loyaltyLimit),
    tagsLimit: toNumber(plan.tagsLimit),
    branchLimit: toNumber(plan.branchLimit),
    analyticsLevel: plan.analyticsLevel || 'basic',
    isActive: plan.isActive ?? true,
    description: plan.description || '',
    isPopular: Boolean(plan.isPopular),
});

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

export const updatePricingPlan = async (plan: UpdatePricingPlanInput): Promise<PricingPlan> => {
    const { id, ...payload } = plan;
    const response = await api.patch(`/plans/admin/${id}`, toPlanPayload(payload));
    return normalizePlan(response);
};

export const deletePricingPlan = async (id: string): Promise<void> => {
    await api.delete(`/plans/admin/${id}`);
};
