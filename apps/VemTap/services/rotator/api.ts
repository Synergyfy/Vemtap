// =============================================================================
// SMART DEAL ROTATOR — FRONTEND API BOUNDARY
// =============================================================================
// This is the ONLY seam the backend team must implement against. Every method
// documents the endpoint it maps to. Until those endpoints exist the methods
// fall back to the isolated mock state in `./mock` so the UI stays functional.
//
// Matching convention of `lib/api/clusters.ts`: real endpoint first, local mock
// fallback on failure. When the backend ships, no component rework is needed.
// -----------------------------------------------------------------------------

import { api } from '@/lib/api';
import { adminClustersApi } from '@/lib/api/clusters';
import type {
    RotationConfig,
    RotationAnalytics,
    RotationPreview,
    RotatorDeal,
    DealEligibility,
    DealSchedule,
    QrRotationConfig,
    RotationStatus,
    RotationStrategy,
    AutoMode,
    GlobalRotationDefaults,
} from './types';
import {
    buildCatalogue,
    computeEligibility,
    getMockConfig,
    patchMockConfig,
    saveMockConfig,
    simulatePreview,
    mockAnalytics,
    getMockQrRotation,
    saveMockQrRotation,
    getMockGlobalDefaults,
    saveMockGlobalDefaults,
    resetMockGlobalDefaults,
    delay,
    type MockRotationMutation,
} from './mock';

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

const catalogueFor = (clusterId: string) => buildCatalogue(clusterId);

interface EligibleDealsPayload {
    mode: AutoMode;
    included: string[];
    excluded: string[];
}

interface FrequencyPayload {
    mode: AutoMode;
    maxViewsPerCustomerPerDay: number;
}

interface SlotsPayload {
    mode: AutoMode;
    count: number;
}

// -----------------------------------------------------------------------------
// rotatorApi
// -----------------------------------------------------------------------------

export const rotatorApi = {
    // -> GET /admin/clusters/:id/rotation
    getConfig: async (clusterId: string): Promise<RotationConfig> => {
        try {
            const res = await api.get(`/admin/clusters/${clusterId}/rotation`);
            const cfg = ensureConfigShape(clusterId, res);
            return cfg;
        } catch {
            const { deals } = catalogueFor(clusterId);
            await delay();
            return getMockConfig(clusterId, deals);
        }
    },

    // -> PATCH /admin/clusters/:id/rotation
    updateConfig: async (clusterId: string, payload: MockRotationMutation): Promise<RotationConfig> => {
        try {
            const res = await api.patch(`/admin/clusters/${clusterId}/rotation`, payload);
            return ensureConfigShape(clusterId, res);
        } catch {
            const { deals } = catalogueFor(clusterId);
            await delay();
            return patchMockConfig(clusterId, payload, deals);
        }
    },

    // -> POST /admin/clusters/:id/rotation/reset
    resetToAutomatic: async (clusterId: string): Promise<RotationConfig> => {
        try {
            const res = await api.post(`/admin/clusters/${clusterId}/rotation/reset`, {});
            return ensureConfigShape(clusterId, res);
        } catch {
            const { deals } = catalogueFor(clusterId);
            await delay();
            const base = getMockConfig(clusterId, deals);
            const reset: RotationConfig = {
                ...base,
                eligibility: { mode: 'automatic', included: [], excluded: [] },
                rotation: { mode: 'automatic', strategy: 'balanced' },
                weights: {},
                schedules: [],
                featuredSlots: { mode: 'automatic', count: 5 },
                frequency: { mode: 'automatic', maxViewsPerCustomerPerDay: 3 },
            };
            saveMockConfig(reset);
            return reset;
        }
    },

    // -> PATCH /admin/clusters/:id/rotation   { status: 'active' | 'paused' }
    setStatus: async (clusterId: string, status: RotationStatus): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, { status });
    },

    // -> GET /admin/clusters/:id/rotation/deals
    getEligibleDeals: async (clusterId: string): Promise<RotatorDeal[]> => {
        try {
            const res = await api.get(`/admin/clusters/${clusterId}/rotation/deals`);
            if (Array.isArray(res) && res.length > 0) {
                return res as RotatorDeal[];
            }
            throw new Error('empty');
        } catch {
            // Merge the rich mock catalogue with any real auto-matched / pinned
            // cluster deals we can already reach, so the demo stays meaningful.
            const { deals } = catalogueFor(clusterId);
            await delay();
            try {
                const real = await adminClustersApi.listOffers(clusterId);
                const extra = [...(real.autoMatched || []), ...(real.pinned || [])].map(o => ({
                    id: o.id,
                    name: o.name,
                    description: o.description || '',
                    mainImage: o.mainImage,
                    isTrending: o.isTrending,
                    businessId: o.businessSlug || o.id,
                    businessName: o.businessName || 'Business',
                    businessSlug: o.businessSlug,
                    categoryId: '',
                    category: 'Other',
                    status: 'active' as const,
                    startDate: null,
                    endDate: null,
                }));
                const seen = new Set(deals.map(d => d.id));
                extra.forEach(e => { if (!seen.has(e.id)) deals.push(e); });
            } catch {
                // listOffers also falls back to local state — fine.
            }
            return deals;
        }
    },

    // -> GET /admin/clusters/:id/rotation/deals/:dealId/eligibility
    getEligibility: async (clusterId: string, dealId: string): Promise<DealEligibility> => {
        try {
            const res = await api.get(`/admin/clusters/${clusterId}/rotation/deals/${dealId}/eligibility`);
            return res as DealEligibility;
        } catch {
            const { deals } = catalogueFor(clusterId);
            const config = await rotatorApi.getConfig(clusterId);
            await delay();
            const deal = deals.find(d => d.id === dealId);
            if (!deal) {
                return { dealId, eligible: false, reason: 'Deal not found', checks: [] };
            }
            return computeEligibility(deal, config);
        }
    },

    // -> PATCH /admin/clusters/:id/rotation → eligibility override
    saveEligibility: async (clusterId: string, payload: EligibleDealsPayload): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            eligibility: payload,
        } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → rotation override
    saveRotation: async (clusterId: string, payload: { mode: AutoMode; strategy: RotationStrategy }): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            rotation: payload,
        } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → weights
    saveWeights: async (clusterId: string, weights: Record<string, number>): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, { weights } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → schedules
    saveSchedules: async (clusterId: string, schedules: DealSchedule[]): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, { schedules } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → featured slots
    saveFeaturedSlots: async (clusterId: string, payload: SlotsPayload): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            featuredSlots: payload,
        } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → frequency (system-level, advanced)
    saveFrequency: async (clusterId: string, payload: FrequencyPayload): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            frequency: payload,
        } as MockRotationMutation);
    },

    // -> PATCH /admin/clusters/:id/rotation → rotationWindowSeconds
    //    Internal-only: the platform team tunes this; never exposed to businesses.
    saveRotationWindow: async (clusterId: string, seconds: number): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            rotationWindowSeconds: seconds,
        } as MockRotationMutation);
    },

    // -> GET /admin/clusters/:id/rotation/analytics
    getAnalytics: async (clusterId: string, clusterName: string, qrScans: number): Promise<RotationAnalytics> => {
        try {
            const res = await api.get(`/admin/clusters/${clusterId}/rotation/analytics`);
            return res as RotationAnalytics;
        } catch {
            await delay();
            return mockAnalytics(clusterId, clusterName, qrScans);
        }
    },

    // -> GET /admin/clusters/:id/rotation/preview?seed=:seed
    getPreview: async (
        clusterId: string,
        opts: { seed?: number } = {},
    ): Promise<RotationPreview> => {
        const seed = opts.seed ?? Math.floor(Math.random() * 1_000_000);
        try {
            const res = await api.get(`/admin/clusters/${clusterId}/rotation/preview`, { params: { seed } });
            if (res?.deals) return res as RotationPreview;
            throw new Error('empty');
        } catch {
            const { deals } = catalogueFor(clusterId);
            const config = await rotatorApi.getConfig(clusterId);
            await delay();
            return simulatePreview(clusterId, deals, config, seed);
        }
    },

    // -> GET /clusters/qr/:qrId/rotation
    getQrRotation: async (clusterId: string, qrId: string): Promise<QrRotationConfig> => {
        try {
            const res = await api.get(`/clusters/qr/${qrId}/rotation`);
            return res as QrRotationConfig;
        } catch {
            await delay();
            return getMockQrRotation(clusterId, qrId);
        }
    },

    // -> PATCH /clusters/qr/:qrId/rotation
    saveQrRotation: async (cfg: QrRotationConfig): Promise<QrRotationConfig> => {
        try {
            const res = await api.patch(`/clusters/qr/${cfg.qrId}/rotation`, cfg);
            return res as QrRotationConfig;
        } catch {
            await delay();
            return saveMockQrRotation(cfg);
        }
    },

    // -> GET /admin/rotator/defaults
    getGlobalDefaults: async (): Promise<GlobalRotationDefaults> => {
        try {
            const res = await api.get('/admin/rotator/defaults');
            return res as GlobalRotationDefaults;
        } catch {
            await delay();
            return getMockGlobalDefaults();
        }
    },

    // -> PATCH /admin/rotator/defaults
    saveGlobalDefaults: async (patch: Partial<GlobalRotationDefaults>): Promise<GlobalRotationDefaults> => {
        try {
            const res = await api.patch('/admin/rotator/defaults', patch);
            return res as GlobalRotationDefaults;
        } catch {
            await delay();
            return saveMockGlobalDefaults(patch);
        }
    },

    // -> POST /admin/rotator/defaults/reset
    resetGlobalDefaults: async (): Promise<GlobalRotationDefaults> => {
        try {
            const res = await api.post('/admin/rotator/defaults/reset', {});
            return res as GlobalRotationDefaults;
        } catch {
            await delay();
            return resetMockGlobalDefaults();
        }
    },
};

// Defensive mapper: if the future backend returns a partial/differently-shaped
// config, pad it to the frontend contract instead of exploding.
const ensureConfigShape = (clusterId: string, raw: Partial<RotationConfig> | null | undefined): RotationConfig => {
    const { deals } = catalogueFor(clusterId);
    const base = getMockConfig(clusterId, deals);
    return {
        ...base,
        ...raw,
        clusterId,
        eligibility: { ...base.eligibility, ...raw?.eligibility },
        rotation: { ...base.rotation, ...raw?.rotation },
        featuredSlots: { ...base.featuredSlots, ...raw?.featuredSlots },
        frequency: { ...base.frequency, ...raw?.frequency },
        weights: raw?.weights ?? base.weights,
        schedules: raw?.schedules ?? base.schedules,
    };
};
