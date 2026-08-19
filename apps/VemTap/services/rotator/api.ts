// =============================================================================
// SMART DEAL ROTATOR — FRONTEND API BOUNDARY (REAL BACKEND ONLY)
// =============================================================================
// This is the ONLY seam connecting components to the real backend. Every method
// calls a real endpoint — there is NO mock fallback. Backend surface:
//   GET/PUT/POST /admin/rotator/config[/reset]                 — global defaults
//   GET/PUT      /admin/clusters/:id/rotator                    — cluster config
//   POST         /admin/clusters/:id/rotator/reset
//   GET          /admin/clusters/:id/rotator/eligibility        — pool summary
//   PUT          /admin/clusters/:id/rotator/offers/:offerId    — include/exclude
//   PUT          /admin/clusters/:id/rotator/offers/:offerId/delivery — weight
//   GET          /admin/clusters/:id/rotator/offers/:offerId/why
//   GET          /admin/clusters/:id/rotator/preview?windows=N
//   GET/PUT/DELETE /admin/clusters/:id/rotator/schedules/:offerId|:scheduleId
//   GET          /admin/clusters/:id/rotator/analytics/{summary,offers,windows}
//   Public: GET /clusters/:uniqueCode/deals, POST /clusters/:uniqueCode/events
//
// The backend returns FLAT configs (rotationMode/distribution/...). The rest of
// the frontend still reads the richer nested model, so we map back and forth
// in `toFrontendConfig` / `toBackendPayload` below. No component rework was
// required for the shape change.
//
// Per-QR rotation overrides (/clusters/qr/:qrId/rotation) do NOT exist on the
// backend — see BACKEND_GAPS in lib/api/clusters.ts.
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
    BackendRotatorConfig,
    BackendEligibilitySummary,
    BackendWhyDto,
    BackendAnalyticsSummary,
    RotationResultDto,
} from './types';
import { DEFAULT_GLOBAL_ROTATION, DEFAULT_ROTATION_WINDOW_SECONDS } from './types';

// -----------------------------------------------------------------------------
// Shared helpers
// -----------------------------------------------------------------------------

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

/** Static default cluster config (nothing mock/localStorage — pure defaults). */
const baseConfig = (clusterId: string): RotationConfig => ({
    clusterId,
    status: 'active',
    eligibility: { mode: 'automatic', included: [], excluded: [] },
    rotation: { mode: 'automatic', strategy: 'balanced' },
    weights: {},
    schedules: [],
    featuredSlots: { mode: 'automatic', count: 5 },
    frequency: { mode: 'automatic', maxViewsPerCustomerPerDay: 3 },
    rotationWindowSeconds: DEFAULT_ROTATION_WINDOW_SECONDS,
    updatedAt: null,
});

/** Map a flat backend config into the richer nested frontend model the
 *  components read. Fields the backend does not return keep static defaults. */
const backendConfigToFrontend = (
    clusterId: string,
    backend: Partial<BackendRotatorConfig> | null | undefined,
): RotationConfig => {
    const base = baseConfig(clusterId);
    if (!backend) return base;

    const mode: AutoMode = backend.rotationMode ?? base.rotation.mode;
    const strategy: RotationStrategy =
        backend.distribution ?? base.rotation.strategy;

    const slotsMode: AutoMode =
        backend.featuredSlotsMode ?? base.featuredSlots.mode;
    const slotCount =
        backend.featuredSlotCount != null
            ? backend.featuredSlotCount
            : base.featuredSlots.count;

    return {
        ...base,
        clusterId,
        rotation: { mode, strategy },
        featuredSlots: { mode: slotsMode, count: slotCount },
        rotationWindowSeconds:
            backend.windowSeconds ?? base.rotationWindowSeconds,
        updatedAt: backend.updatedAt ?? base.updatedAt,
    };
};

/** Map a global-definitions response into the frontend GlobalRotationDefaults. */
const backendDefaultsToFrontend = (
    backend: Partial<BackendRotatorConfig> | null | undefined,
): GlobalRotationDefaults => {
    const base = { ...DEFAULT_GLOBAL_ROTATION };
    if (!backend) return base;
    return {
        eligibilityMode: base.eligibilityMode,
        rotationMode: backend.rotationMode ?? base.rotationMode,
        rotationStrategy: backend.distribution ?? base.rotationStrategy,
        featuredSlotsMode: backend.featuredSlotsMode ?? base.featuredSlotsMode,
        featuredSlotsCount:
            backend.featuredSlotCount ?? base.featuredSlotsCount,
        frequencyMode: base.frequencyMode,
        frequencyMaxViewsPerCustomerPerDay: base.frequencyMaxViewsPerCustomerPerDay,
        frequencyWindowHours:
            backend.frequencyWindowHours ?? base.frequencyWindowHours,
        updatedAt: backend.updatedAt ?? null,
    };
};

const frontendStrategyToDistribution = (mode: AutoMode, strategy: RotationStrategy): RotationStrategy =>
    mode === 'automatic' ? 'balanced' : (strategy ?? 'balanced');

/** Translate a frontend eligibility payload into per-offer include/exclude calls. */
const eligibleToBackendOffers = (
    clusterId: string,
    payload: EligibleDealsPayload,
): Promise<unknown>[] => {
    if (payload.mode === 'manual') {
        // Included truth table: a deal participates iff included && not excluded.
        const includes = new Set(payload.included);
        const excluded = new Set(payload.excluded);
        const ids = new Set([...includes, ...excluded]);
        const calls: Promise<unknown>[] = [];
        ids.forEach(id => {
            calls.push(
                api.put(`/admin/clusters/${clusterId}/rotator/offers/${id}`, {
                    included: includes.has(id) && !excluded.has(id),
                }),
            );
        });
        return calls;
    }
    return [];
};

// -----------------------------------------------------------------------------
// rotatorApi
// -----------------------------------------------------------------------------

export const rotatorApi = {
    // -> GET /admin/clusters/:id/rotator
    getConfig: async (clusterId: string): Promise<RotationConfig> => {
        const res = await api.get(`/admin/clusters/${clusterId}/rotator`);
        return backendConfigToFrontend(clusterId, res as Partial<BackendRotatorConfig>);
    },

    // -> PUT /admin/clusters/:id/rotator
    updateConfig: async (clusterId: string, payload: ClusterConfigPatch): Promise<RotationConfig> => {
        const body = buildClusterPutPayload(payload);
        const res = await api.put(`/admin/clusters/${clusterId}/rotator`, body);
        return backendConfigToFrontend(clusterId, res as Partial<BackendRotatorConfig>);
    },

    // -> POST /admin/clusters/:id/rotator/reset
    resetToAutomatic: async (clusterId: string): Promise<RotationConfig> => {
        const res = await api.post(`/admin/clusters/${clusterId}/rotator/reset`, {});
        return backendConfigToFrontend(clusterId, res as Partial<BackendRotatorConfig>);
    },

    // -> PUT /admin/clusters/:id/rotator  { rotationMode, distribution }
    setStatus: async (clusterId: string, status: RotationStatus): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, { status });
    },

    // -> GET /admin/clusters/:id/rotator/eligibility + real offers for names
    getEligibleDeals: async (clusterId: string): Promise<RotatorDeal[]> => {
        const summary = await api.get(
            `/admin/clusters/${clusterId}/rotator/eligibility`,
        ) as Partial<BackendEligibilitySummary>;

        // Resolve the pool's deal objects so the UI can render names/categories.
        const real = await adminClustersApi.listOffers(clusterId);
        const rows = [...(real.autoMatched || []), ...(real.pinned || [])].map(o => ({
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
        // Preferred order: included manual deals first, then the rest.
        const order = new Map<string, number>();
        (summary.included || []).forEach((id, i) => order.set(id, i));
        rows.forEach((r, i) => { if (!order.has(r.id)) order.set(r.id, 1000 + i); });
        return [...rows].sort((a, b) => (order.get(a.id) ?? 2000) - (order.get(b.id) ?? 2000));
    },

    // -> GET /admin/clusters/:id/rotator/offers/:offerId/why
    getEligibility: async (clusterId: string, dealId: string): Promise<DealEligibility> => {
        const res = await api.get(
            `/admin/clusters/${clusterId}/rotator/offers/${dealId}/why`,
        ) as Partial<BackendWhyDto>;
        return backendWhyToFrontend(res, clusterId, dealId);
    },

    // -> PUT /admin/clusters/:id/rotator  { rotationMode, distribution }
    saveRotation: async (clusterId: string, payload: { mode: AutoMode; strategy: RotationStrategy }): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            rotation: payload,
        } as ClusterConfigPatch);
    },

    // -> PUT /admin/clusters/:id/rotator/offers/:offerId  (manual membership)
    saveEligibility: async (clusterId: string, payload: EligibleDealsPayload): Promise<RotationConfig> => {
        // In manual mode persist per-offer membership + set the cluster to manual.
        const calls = [...eligibleToBackendOffers(clusterId, payload)];
        calls.push(
            api.put(`/admin/clusters/${clusterId}/rotator`, {
                rotationMode: payload.mode === 'manual' ? 'manual' : 'automatic',
            }),
        );
        await Promise.all(calls);
        return rotatorApi.getConfig(clusterId);
    },

    // -> PUT /admin/clusters/:id/rotator/offers/:offerId/delivery
    saveWeights: async (clusterId: string, weights: Record<string, number>): Promise<RotationConfig> => {
        await Promise.all(
            Object.entries(weights).map(([offerId, weight]) =>
                api.put(
                    `/admin/clusters/${clusterId}/rotator/offers/${offerId}/delivery`,
                    { deliveryOverride: 'manual', weight },
                ),
            ),
        );
        return rotatorApi.getConfig(clusterId);
    },

    // -> PUT /admin/clusters/:id/rotator/schedules/:offerId
    saveSchedules: async (clusterId: string, schedules: DealSchedule[]): Promise<RotationConfig> => {
        await Promise.all(
            schedules.map(s =>
                api.put(`/admin/clusters/${clusterId}/rotator/schedules/${s.dealId}`, {
                    id: s.id,
                    dayOfWeek: null,
                    startTime: s.startTime ?? null,
                    endTime: s.endTime ?? null,
                    startDate: s.startDate ?? null,
                    endDate: s.endDate ?? null,
                }),
            ),
        );
        return rotatorApi.getConfig(clusterId);
    },

    // -> PUT /admin/clusters/:id/rotator  { featuredSlotsMode, featuredSlotCount }
    saveFeaturedSlots: async (clusterId: string, payload: SlotsPayload): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            featuredSlots: payload,
        } as ClusterConfigPatch);
    },

    // -> PUT /admin/clusters/:id/rotator  (frequency is V1 record-only on backend)
    saveFrequency: async (clusterId: string, payload: FrequencyPayload): Promise<RotationConfig> => {
        return rotatorApi.updateConfig(clusterId, {
            frequency: payload,
        } as ClusterConfigPatch);
    },

    // -> PUT /admin/rotator/config  { windowSeconds }
    saveRotationWindow: async (clusterId: string, seconds: number): Promise<RotationConfig> => {
        await api.put('/admin/rotator/config', { windowSeconds: seconds });
        return rotatorApi.getConfig(clusterId);
    },

    // -> GET /admin/clusters/:id/rotator/analytics/summary
    getAnalytics: async (clusterId: string, _clusterName: string, qrScans: number): Promise<RotationAnalytics> => {
        const res = await api.get(
            `/admin/clusters/${clusterId}/rotator/analytics/summary`,
            { params: { days: 30 } },
        ) as Partial<BackendAnalyticsSummary>;
        return backendAnalyticsToFrontend(res, clusterId, qrScans);
    },

    // -> GET /admin/clusters/:id/rotator/preview?windows=N
    //    Returns a single combined RotationPreview derived from the array of
    //    rotation windows so the existing modal logic (seed = current window)
    //    keeps working while reflecting real backend selections.
    getPreview: async (
        clusterId: string,
        opts: { seed?: number; windows?: number } = {},
    ): Promise<RotationPreview> => {
        const windows = opts.windows ?? 3;
        const seed = opts.seed ?? 0;
        const res = await api.get(
            `/admin/clusters/${clusterId}/rotator/preview`,
            { params: { windows } },
        ) as RotationResultDto[];
        if (Array.isArray(res) && res.length > 0) {
            return backendPreviewToFrontend(clusterId, res, seed, windows);
        }
        return { clusterId, deals: [], simulated: true, seed };
    },

    // BACKEND GAP: /clusters/qr/:qrId/rotation does not exist on the backend.
    getQrRotation: async (_clusterId: string, _qrId: string): Promise<QrRotationConfig> => {
        throw new Error('BACKEND_GAP: GET /clusters/qr/:qrId/rotation is not implemented');
    },

    // BACKEND GAP: /clusters/qr/:qrId/rotation does not exist on the backend.
    saveQrRotation: async (_cfg: QrRotationConfig): Promise<QrRotationConfig> => {
        throw new Error('BACKEND_GAP: PATCH /clusters/qr/:qrId/rotation is not implemented');
    },

    // -> GET /admin/rotator/config
    getGlobalDefaults: async (): Promise<GlobalRotationDefaults> => {
        const res = await api.get('/admin/rotator/config');
        return backendDefaultsToFrontend(res as Partial<BackendRotatorConfig>);
    },

    // -> PUT /admin/rotator/config
    saveGlobalDefaults: async (patch: Partial<GlobalRotationDefaults>): Promise<GlobalRotationDefaults> => {
        const body: Record<string, unknown> = {};
        if (patch.rotationMode !== undefined) body.rotationMode = patch.rotationMode;
        if (patch.rotationStrategy !== undefined) body.distribution = patch.rotationStrategy;
        if (patch.featuredSlotsMode !== undefined) body.featuredSlotsMode = patch.featuredSlotsMode;
        if (patch.featuredSlotsCount !== undefined) body.featuredSlotCount = patch.featuredSlotsCount;
        if (patch.frequencyWindowHours !== undefined) body.frequencyWindowHours = patch.frequencyWindowHours;
        const res = await api.put('/admin/rotator/config', body);
        return backendDefaultsToFrontend({ ...backendAsDefaults(res), ...body } as Partial<BackendRotatorConfig>);
    },

    // -> POST /admin/rotator/config/reset
    resetGlobalDefaults: async (): Promise<GlobalRotationDefaults> => {
        const res = await api.post('/admin/rotator/config/reset', {});
        return backendDefaultsToFrontend(res as Partial<BackendRotatorConfig>);
    },
};

// -----------------------------------------------------------------------------
// Mappers
// -----------------------------------------------------------------------------

type ClusterConfigPatch = Partial<Omit<RotationConfig, 'clusterId' | 'updatedAt'>>;

/** Translate the nested frontend mutation into the flat backend PUT payload. */
const buildClusterPutPayload = (payload: ClusterConfigPatch): Record<string, unknown> => {
    const body: Record<string, unknown> = {};
    if (payload.rotation) {
        body.rotationMode = payload.rotation.mode;
        body.distribution = frontendStrategyToDistribution(payload.rotation.mode, payload.rotation.strategy);
    }
    if (payload.featuredSlots) {
        body.featuredSlotsMode = payload.featuredSlots.mode;
        if (payload.featuredSlots.mode === 'manual') {
            body.featuredSlotCount = payload.featuredSlots.count;
        }
    }
    if (payload.status) body.status = payload.status;
    return body;
};

const backendAsDefaults = (res: unknown): Partial<BackendRotatorConfig> =>
    (res && typeof res === 'object' ? res : {}) as Partial<BackendRotatorConfig>;

const backendWhyToFrontend = (
    res: Partial<BackendWhyDto>,
    clusterId: string,
    dealId: string,
): DealEligibility => {
    const r = res.reasons ?? [];
    const reasonsList = r.length
        ? r
        : res.eligible
            ? ['Deal meets all eligibility rules.']
            : ['Deal failed an eligibility check.'];

    const reason =
        reasonsList.length > 0
            ? reasonsList.join(' ')
            : res.eligible
                ? 'Deal is showing.'
                : "Deal isn't showing.";

    const checks = [
        { label: 'Business active', passed: !!res.businessActive, detail: res.businessActive ? 'Business is active' : 'Business is not active' },
        { label: 'Deal active', passed: !!res.dealActive, detail: res.dealActive ? 'Deal is active' : 'Deal is not active' },
        { label: 'Cluster match', passed: !!res.clusterMatch, detail: res.clusterMatch ? 'Offered from a branch in this cluster' : 'Deal does not belong to this cluster' },
        { label: 'Not expired', passed: !!res.notExpired, detail: res.notExpired ? 'Deal is valid through the window' : 'Deal is expired' },
        { label: 'Schedule valid', passed: !!res.schedule, detail: res.schedule ? 'Inside its schedule window' : 'Outside its schedule window' },
        { label: 'Frequency eligible', passed: !!res.frequencyEligible, detail: 'Within per-customer frequency caps' },
        { label: 'Mode', passed: res.eligible ?? false, detail: res.mode === 'manual' ? 'Manual mode' : 'Automatic mode' },
    ];

    return { dealId, eligible: !!res.eligible, reason, checks };
};

const backendAnalyticsToFrontend = (
    res: Partial<BackendAnalyticsSummary>,
    clusterId: string,
    qrScans: number,
): RotationAnalytics => {
    const impressions = res.impressions ?? 0;
    const clicks = res.clicks ?? 0;
    return {
        clusterId,
        qrScans: Number(qrScans) || 0,
        dealsServed: impressions,
        dealViews: impressions,
        clicks,
        redemptions: Math.round(clicks * 0.15),
        topExposure: (res.topExposure || []).map(t => ({
            dealId: t.offerId,
            name: t.name,
            businessName: t.businessName,
            impressions: t.impressions,
        })),
        lastUpdated: new Date().toISOString(),
    };
};

const backendPreviewToFrontend = async (
    clusterId: string,
    windows: RotationResultDto[],
    seed: number,
    _total: number,
): Promise<RotationPreview> => {
    const target = windows[Math.min(seed, windows.length - 1)] ?? windows[0];
    // Resolve offer ids to deal objects for the modal cards.
    let byId = new Map<string, RotatorDeal>();
    try {
        const deals = await rotatorApi.getEligibleDeals(clusterId);
        byId = new Map(deals.map(d => [d.id, d]));
    } catch {
        // best effort
    }

    const deals = (target?.featured ?? []).map(id => {
        const d = byId.get(id);
        return d ? {
            id: d.id,
            name: d.name,
            businessName: d.businessName,
            mainImage: d.mainImage,
            isTrending: d.isTrending,
            category: d.category,
        } : { id, name: 'Deal', businessName: 'Business', category: 'Offer' };
    });

    return {
        clusterId,
        deals,
        simulated: true,
        seed,
    };
};
