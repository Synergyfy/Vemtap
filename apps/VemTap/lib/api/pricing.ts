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
    teamMembersLimit: raw?.teamMembersLimit !== undefined && raw?.teamMembersLimit !== null ? toNumber(raw.teamMembersLimit) : null,
    loyaltyEnabled: Boolean(raw?.loyaltyEnabled),
    loyaltyLimit: raw?.loyaltyLimit !== undefined && raw?.loyaltyLimit !== null ? toNumber(raw.loyaltyLimit) : null,
    branchesEnabled: Boolean(raw?.branchesEnabled),
    branchLimit: raw?.branchLimit !== undefined && raw?.branchLimit !== null ? toNumber(raw.branchLimit) : null,
    analyticsEnabled: Boolean(raw?.analyticsEnabled),
    analyticsLevel: raw?.analyticsLevel === 'advanced' || raw?.analyticsLevel === 'none' ? raw.analyticsLevel : 'basic',
    catalogueEnabled: Boolean(raw?.catalogueEnabled),
    maxCatalogueItems: raw?.maxCatalogueItems !== undefined && raw?.maxCatalogueItems !== null ? toNumber(raw.maxCatalogueItems) : null,
    maxCatalogueCategories: raw?.maxCatalogueCategories !== undefined && raw?.maxCatalogueCategories !== null ? toNumber(raw.maxCatalogueCategories) : null,
    maxCatalogueOffers: raw?.maxCatalogueOffers !== undefined && raw?.maxCatalogueOffers !== null ? toNumber(raw.maxCatalogueOffers) : null,
    automationsEnabled: Boolean(raw?.automationsEnabled),
    maxAutomations: raw?.maxAutomations !== undefined && raw?.maxAutomations !== null ? toNumber(raw.maxAutomations) : null,
    isActive: raw?.isActive ?? true,
    description: String(raw?.description ?? ''),
    isPopular: Boolean(raw?.isPopular),
    inventoryEnabled: Boolean(raw?.inventoryEnabled),
    inventoryLimit: raw?.inventoryLimit !== undefined && raw?.inventoryLimit !== null ? toNumber(raw.inventoryLimit) : null,
    posEnabled: Boolean(raw?.posEnabled),
    posTerminalLimit: raw?.posTerminalLimit !== undefined && raw?.posTerminalLimit !== null ? toNumber(raw.posTerminalLimit) : null,
    visitorsEnabled: Boolean(raw?.visitorsEnabled),
    inAppChatEnabled: Boolean(raw?.inAppChatEnabled),
    formsEnabled: Boolean(raw?.formsEnabled),
    formsLimit: raw?.formsLimit !== undefined && raw?.formsLimit !== null ? toNumber(raw.formsLimit) : null,
    businessQrEnabled: Boolean(raw?.businessQrEnabled),
    marketingKitEnabled: Boolean(raw?.marketingKitEnabled),
    marketingKitLimit: raw?.marketingKitLimit !== undefined && raw?.marketingKitLimit !== null ? toNumber(raw.marketingKitLimit) : null,
    discoveryEnabled: Boolean(raw?.discoveryEnabled),
    staffRolesEnabled: Boolean(raw?.staffRolesEnabled),
    staffRolesLimit: raw?.staffRolesLimit !== undefined && raw?.staffRolesLimit !== null ? toNumber(raw.staffRolesLimit) : null,
    activityLogEnabled: Boolean(raw?.activityLogEnabled),
    qrCodesEnabled: Boolean(raw?.qrCodesEnabled),
    qrCodesLimit: raw?.qrCodesLimit !== undefined && raw?.qrCodesLimit !== null ? toNumber(raw.qrCodesLimit) : null,
    aiCopilotEnabled: Boolean(raw?.aiCopilotEnabled),
    aiCredits: raw?.aiCredits !== undefined && raw?.aiCredits !== null ? toNumber(raw.aiCredits) : 0,
    permissionsConfiguredAt: raw?.permissionsConfiguredAt ? String(raw.permissionsConfiguredAt) : null,
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
        'isActive', 'description', 'isPopular', 'qrThrivePlanId',
        'inventoryEnabled', 'inventoryLimit', 'posEnabled', 'posTerminalLimit',
        'visitorsEnabled', 'inAppChatEnabled', 'formsEnabled', 'formsLimit',
        'businessQrEnabled', 'marketingKitEnabled', 'marketingKitLimit',
        'discoveryEnabled', 'staffRolesEnabled', 'staffRolesLimit',
        'activityLogEnabled', 'qrCodesEnabled', 'qrCodesLimit',
        'aiCopilotEnabled', 'aiCredits'
    ];

    fields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(plan, field)) {
            const val = plan[field];
            if (field === 'features' && Array.isArray(val)) {
                payload[field] = val;
            } else if (typeof val === 'boolean') {
                payload[field] = val;
            } else if (field === 'analyticsLevel' || field === 'name' || field === 'currency' || field === 'description' || field === 'qrThrivePlanId') {
                payload[field] = val;
            } else if (val === null) {
                payload[field] = null;
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

export const updatePlanPermissions = async (
    planId: string,
    permissions: Partial<PricingPlan>
): Promise<PricingPlan> => {
    const response = await api.put(`/plans/admin/${planId}/permissions`, toPlanPayload(permissions));
    return normalizePlan(response);
};
