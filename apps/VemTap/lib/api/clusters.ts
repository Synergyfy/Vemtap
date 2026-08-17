// =====================
// CLUSTERS & CLUSTER QR DISCOVERY — REAL BACKEND ONLY
// =====================
// The real backend (`modules/clusters`) provides:
//   GET  /admin/clusters               (list)
//   GET  /admin/clusters/:id           (detail)
//   POST /admin/clusters               (create)
//   PATCH /admin/clusters/:id          (update / QR toggle)
//   DELETE /admin/clusters/:id         (soft delete)
//   POST /admin/clusters/auto-assign   (bulk branch assignment)
//   POST /admin/clusters/:id/branches  (add branch)
//   DELETE /admin/clusters/:id/branches/:branchId (remove branch)
//   GET  /admin/clusters/:id/offers    (auto-matched + pinned offers)
//   PATCH /admin/clusters/:id/offers/:offerId (pin/unpin)
//   Public: /clusters/context/:uniqueCode, /clusters/:uniqueCode/deals,
//           /clusters/:uniqueCode/events
//
// Every method here calls a real endpoint. There is NO mock fallback.
// Features the backend does not model yet (multiple QR codes per cluster,
// per-QR deal config, dynamic QR destinations, per-QR rotation) are listed in
// BACKEND_GAPS at the bottom — the frontend does not fabricate them.

import { api } from '../api';

// ---------------------------------------------------------------
// Types (contract)
// ---------------------------------------------------------------

export type ClusterType = 'country' | 'state' | 'market' | 'building' | 'custom';

export interface Cluster {
    id: string;
    name: string;
    description?: string;
    type: ClusterType;
    parentId?: string | null;
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    latitude?: number | null;
    longitude?: number | null;
    radiusM?: number | null;
    isActive: boolean;
    /** Real backend — the QR identifier (CL-XXXXXXXXX). */
    uniqueCode?: string;
    /** Real backend — absolute QR target URL, e.g. https://vemtap.com/c/{uniqueCode}. */
    qrUrl?: string;
    qrCodesCount: number;
    totalScans: number;
    autoMatchedOffersCount: number;
    pinnedOffersCount: number;
    /** Populated by GET /admin/clusters/:id only. */
    branches?: ClusterBranch[];
    createdAt: string;
    updatedAt: string;
}

/** The single real QR of a cluster. Backend stores one QR per cluster — the
 *  uniqueCode — so the list/gallery of extra codes is a BACKEND GAP. */
export interface ClusterQrCode {
    id: string;
    clusterId: string;
    code: string;
    scanUrl: string;
    isActive: boolean;
    totalScans: number;
    createdAt: string;
}

/** What scanning a specific QR should show. BACKEND GAP — the backend does not
 *  yet model per-QR deal configuration (see BACKEND_GAPS). */
export interface ClusterQrConfig {
    /** 'all' = show the cluster's whole deal feed; 'custom' = only curated offers. */
    mode: 'all' | 'custom';
    /** Curated offer ids (used when mode === 'custom'). */
    offerIds: string[];
    /** Max number of deals rotated/shown on this QR. */
    slotCount: number;
}

/** A QR's scannable code is stable forever; what it *lands on* is dynamic.
 *  BACKEND GAP — the backend does not yet model dynamic destinations. */
export interface ClusterQrDynamic {
    qrCodeId: string;
    /** 'default' = stable cluster scan page; 'custom' = redirect to `url`. */
    mode: 'default' | 'custom';
    /** Destination when mode === 'custom'. */
    url: string | null;
    /** Override end time (ISO). After this, behaviour returns to 'default'. */
    expiresAt: string | null;
}

export interface CreateClusterDto {
    name: string;
    description?: string;
    type: ClusterType;
    parentId?: string | null;
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    latitude?: number | null;
    longitude?: number | null;
    radiusM?: number | null;
    isActive?: boolean;
    /** Backend-supported (PATCH /admin/clusters/:id). */
    qrIsActive?: boolean;
}

export type UpdateClusterDto = Partial<CreateClusterDto>;

export interface ClusterOfferRow {
    id: string;
    name: string;
    description?: string;
    businessName?: string;
    businessSlug?: string;
    mainImage?: string | null;
    isTrending?: boolean;
    state?: string;
    city?: string;
    matchReason?: string;
}

export interface ClusterBranch {
    id: string;
    name: string;
    uniqueCode?: string;
    username?: string;
    logoUrl?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    isActive?: boolean;
}

export interface ClusterOffersResponse {
    autoMatched: ClusterOfferRow[];
    pinned: ClusterOfferRow[];
    total: number;
}

// ---------------------------------------------------------------
// Admin API (real backend)
// ---------------------------------------------------------------

// ---- Real backend DTOs (internal) -------------------------------
interface BBackendCluster {
    id: string;
    name: string;
    type: ClusterType;
    parentId: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    area: string | null;
    uniqueCode: string;
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    radiusMeters: number;
    isActive: boolean;
    qrIsActive: boolean;
    branchCount: number;
    activeOfferCount: number;
    scanCount: number;
    createdAt: string;
}

/** Public app origin — env-driven so local dev links point at localhost instead
 *  of the production domain. Order: NEXT_PUBLIC_APP_URL → window origin → prod. */
const getAppBaseUrl = () =>
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://vemtap.com');

/** Map a real backend cluster into the rich UI model. */
const toRichCluster = (b: BBackendCluster): Cluster => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    type: b.type || 'market',
    parentId: b.parentId ?? null,
    country: b.country || '',
    state: b.state || '',
    city: b.city || '',
    area: b.area || '',
    latitude: b.latitude != null ? Number(b.latitude) : null,
    longitude: b.longitude != null ? Number(b.longitude) : null,
    radiusM: b.radiusMeters != null ? Number(b.radiusMeters) : null,
    isActive: b.isActive,
    uniqueCode: b.uniqueCode,
    qrUrl: `${getAppBaseUrl()}/c/${b.uniqueCode}`,
    qrCodesCount: b.qrIsActive ? 1 : 0,
    totalScans: Number(b.scanCount) || 0,
    autoMatchedOffersCount: Number(b.activeOfferCount) || 0,
    pinnedOffersCount: 0,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
});

/** Convert the rich UI dto to the backend Create/Update payload. */
const toBackendPayload = (data: Partial<CreateClusterDto>) => ({
    name: data.name,
    type: data.type,
    parentId: data.parentId ?? undefined,
    country: data.country || undefined,
    state: data.state || undefined,
    city: data.city || undefined,
    area: data.area || undefined,
    description: data.description,
    latitude: data.latitude ?? undefined,
    longitude: data.longitude ?? undefined,
    radiusMeters: data.radiusM ?? undefined,
    isActive: data.isActive ?? undefined,
    qrIsActive: data.qrIsActive ?? undefined,
});

/** Synthesise the single real QR of a cluster from its own backend fields
 *  (uniqueCode + qrIsActive + scanCount). The backend stores exactly one QR
 *  per cluster, so there is no per-cluster QR-list endpoint. */
const toQrCode = (cluster: Cluster): ClusterQrCode => ({
    id: `${cluster.id}-qr`,
    clusterId: cluster.id,
    code: cluster.uniqueCode || '',
    scanUrl: cluster.qrUrl || `${getAppBaseUrl()}/c/${cluster.uniqueCode}`,
    isActive: cluster.isActive && cluster.qrCodesCount > 0,
    totalScans: cluster.totalScans,
    createdAt: cluster.createdAt,
});

export const adminClustersApi = {
    // -> GET /admin/clusters
    list: async () => {
        const res = await api.get('/admin/clusters', { params: { limit: 100 } });
        const items: BBackendCluster[] = Array.isArray(res) ? res : res?.data || [];
        return items.map(toRichCluster);
    },

    // -> GET /admin/clusters/:id
    get: async (id: string) => {
        const b = await api.get(`/admin/clusters/${id}`) as BBackendCluster & {
            branches?: Array<{ id: string; name: string; uniqueCode?: string; username?: string; logoUrl?: string | null; address?: string | null; city?: string | null; state?: string | null; isActive?: boolean }>;
        };
        const cluster = toRichCluster(b);
        if (b.branches) {
            cluster.branches = b.branches;
        }
        return cluster;
    },

    // -> POST /admin/clusters
    create: async (data: CreateClusterDto) => {
        const b = await api.post('/admin/clusters', toBackendPayload(data));
        return toRichCluster(b as BBackendCluster);
    },

    // -> PATCH /admin/clusters/:id
    update: async (id: string, data: UpdateClusterDto) => {
        const b = await api.patch(`/admin/clusters/${id}`, toBackendPayload(data));
        return toRichCluster(b as BBackendCluster);
    },

    // -> DELETE /admin/clusters/:id
    remove: async (id: string) => {
        await api.delete(`/admin/clusters/${id}`);
        return { success: true };
    },

    // -> POST /admin/clusters/auto-assign
    autoAssign: async (dryRun = false) => {
        return api.post('/admin/clusters/auto-assign', { dryRun }) as Promise<{
            dryRun: boolean;
            totalCandidates: number;
            assigned: number;
            assignments: Array<{ branchId: string; clusterId: string | null }>;
        }>;
    },

    // -> POST /admin/clusters/:id/branches
    addBranch: async (clusterId: string, branchId: string) => {
        return api.post(`/admin/clusters/${clusterId}/branches`, { branchId }) as Promise<{ success: boolean }>;
    },

    // -> DELETE /admin/clusters/:id/branches/:branchId
    removeBranch: async (clusterId: string, branchId: string) => {
        return api.delete(`/admin/clusters/${clusterId}/branches/${branchId}`) as Promise<{ success: boolean }>;
    },

    // -> Single real QR per cluster (derived from cluster.uniqueCode).
    // BACKEND GAP: no per-cluster QR-code listing endpoint. The single QR is
    // built from the cluster's own real fields.
    listQrCodes: async (cluster: Cluster): Promise<ClusterQrCode[]> => {
        if (!cluster.uniqueCode) return [];
        return [toQrCode(cluster)];
    },

    // BACKEND GAP: no endpoint to generate additional QR codes per cluster.
    generateQrCodes: async (_clusterId: string, _data: { quantity?: number; notes?: string }): Promise<ClusterQrCode[]> => {
        throw new Error('BACKEND_GAP: POST /admin/clusters/:id/qr-codes is not implemented');
    },

    // -> PATCH /admin/clusters/:id  { qrIsActive } — toggles the single cluster QR.
    setQrCodeActive: async (cluster: Cluster, isActive: boolean): Promise<ClusterQrCode> => {
        const b = await api.patch(`/admin/clusters/${cluster.id}`, { qrIsActive: isActive }) as Partial<BBackendCluster>;
        return toQrCode({
            ...cluster,
            isActive: cluster.isActive,
            qrCodesCount: (b.qrIsActive ?? isActive) ? 1 : 0,
        });
    },

    // BACKEND GAP: no endpoint to delete a QR code.
    removeQrCode: async (_clusterId: string, _qrId: string): Promise<{ success: boolean }> => {
        throw new Error('BACKEND_GAP: DELETE /admin/clusters/:id/qr-codes/:qrId is not implemented');
    },

    // BACKEND GAP: per-QR deal configuration is not modelled in the backend.
    createQrCode: async (_clusterId: string): Promise<ClusterQrCode> => {
        throw new Error('BACKEND_GAP: POST /admin/clusters/:id/qr-codes is not implemented');
    },

    getQrConfig: async (_qrCodeId: string): Promise<ClusterQrConfig> => {
        throw new Error('BACKEND_GAP: GET /admin/clusters/:id/qr-codes/:qrId/config is not implemented');
    },

    saveQrConfig: async (_qrCodeId: string, _config: ClusterQrConfig): Promise<ClusterQrConfig> => {
        throw new Error('BACKEND_GAP: PUT /admin/clusters/:id/qr-codes/:qrId/config is not implemented');
    },

    getQrOfferOptions: async (): Promise<ClusterOfferRow[]> => {
        throw new Error('BACKEND_GAP: scoped offer picker endpoint is not implemented — use GET /admin/clusters/:id/offers');
    },

    getQrDynamic: async (_qrCodeId: string): Promise<ClusterQrDynamic> => {
        throw new Error('BACKEND_GAP: GET /admin/clusters/:id/qr-codes/:qrId/destination is not implemented');
    },

    setDynamicToDefault: async (_qrCodeId: string): Promise<ClusterQrDynamic> => {
        throw new Error('BACKEND_GAP: DELETE /admin/clusters/:id/qr-codes/:qrId/destination is not implemented');
    },

    setDynamicUrl: async (_qrCodeId: string, _url: string, _expiresAt?: string | null): Promise<ClusterQrDynamic> => {
        throw new Error('BACKEND_GAP: PUT /admin/clusters/:id/qr-codes/:qrId/destination is not implemented');
    },

    // -> GET /admin/clusters/:id/offers  =>  { autoMatched, pinned, total }
    listOffers: async (clusterId: string): Promise<ClusterOffersResponse> => {
        const res = await api.get(`/admin/clusters/${clusterId}/offers`);
        const body = (res || {}) as { autoMatched?: ClusterDeal[]; pinned?: ClusterDeal[]; total?: number };
        const mapDeal = (d: ClusterDeal): ClusterOfferRow => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            businessName: d.business?.name || '',
            businessSlug: d.branch?.slug || '',
            mainImage: d.mainImage,
            isTrending: d.isTrending,
            state: d.branch?.state || '',
            city: d.branch?.city || '',
            matchReason: 'pinned manually',
        });
        const autoMatched = (body.autoMatched || []).map(d => ({ ...mapDeal(d), matchReason: 'auto-matched' }));
        const pinned = (body.pinned || []).map(mapDeal);
        return {
            autoMatched,
            pinned,
            total: body.total ?? autoMatched.length + pinned.length,
        };
    },

    // -> PATCH /admin/clusters/:id/offers/:offerId  =>  { pinned: boolean }
    setOfferPinned: async (clusterId: string, offerId: string, pinned: boolean) => {
        const res = await api.patch(`/admin/clusters/${clusterId}/offers/${offerId}`, { pinned });
        return { pinned: res?.pinned ?? pinned };
    },
};

// ---------------------------------------------------------------
// Public API (real backend) — used by /c/[uniqueCode]
// ---------------------------------------------------------------

export type ClusterDealsSortBy =
    | 'fair' | 'newest' | 'price_asc' | 'price_desc' | 'distance_asc' | 'distance_desc';

export interface ClusterDeal {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    terms: string[];
    pricingType: 'sum' | 'percentage_discount' | 'fixed_discount_price';
    discountValue: number | null;
    fixedPrice: number | null;
    calculatedPrice: number;
    originalPrice: number;
    dealPrice: number;
    discountPercent: number;
    mainImage: string | null;
    galleryImages: string[];
    startDate: string | null;
    endDate: string | null;
    isExpired: boolean;
    isTrending: boolean;
    claimedCount: number;
    maxClaims: number;
    remainingLimit: number | null;
    status: 'active' | 'inactive';
    views: number;
    offerType: string | null;
    audience: string | null;
    audienceTarget: string | null;
    maxClaimsPerCustomer: number | null;
    claimCodePrefix: string | null;
    branchId: string;
    businessId: string;
    distanceMeters: number | null;
    branch: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
    } | null;
    business: { id: string; name: string; logoUrl: string | null } | null;
}

export interface ClusterContextResponse {
    qrActive: boolean;
    cluster: {
        id: string;
        name: string;
        uniqueCode: string;
        description: string | null;
        qrUrl: string;
        branchCount: number;
        radiusMeters: number;
    };
    branches: Array<{
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        latitude: number;
        longitude: number;
    }>;
}

export interface ClusterDealsResponse {
    active: boolean;
    reason?: 'qr_deactivated' | 'cluster_inactive';
    data: ClusterDeal[];
    /** Featured deal objects selected for the current rotation window. */
    featured?: ClusterDeal[];
    /** Current rotation window id (see Smart Deal Rotator). */
    rotationWindowId?: number;
    total: number;
    page: number;
    limit: number;
    sortBy: ClusterDealsSortBy;
    seed: number | null;
    bucket: number | null;
    reference: { lat: number; lng: number; source: 'customer' | 'cluster_center' };
}

export interface ClusterDealsQuery {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: ClusterDealsSortBy;
    lat?: number;
    lng?: number;
}

export const clustersPublicApi = {
    // -> GET /clusters/context/:uniqueCode
    getContext: (uniqueCode: string) =>
        api.get(`/clusters/context/${uniqueCode}`) as Promise<ClusterContextResponse>,
    // -> GET /clusters/:uniqueCode/deals
    getDeals: (uniqueCode: string, query: ClusterDealsQuery = {}) =>
        api.get(`/clusters/${uniqueCode}/deals`, { params: query }) as Promise<ClusterDealsResponse>,
    // -> POST /clusters/:uniqueCode/events  (rotator view/click analytics)
    //    Requires a valid RFC4122 UUID v4 as x-visit-session-token.
    recordEvent: (
        uniqueCode: string,
        sessionToken: string,
        body: { offerId: string; type: 'view' | 'click'; windowId?: number },
    ) =>
        api.post(`/clusters/${uniqueCode}/events`, body, {
            headers: { 'x-visit-session-token': sessionToken },
        }) as Promise<{ success: boolean; offerId: string }>,
};

// ---------------------------------------------------------------
// BACKEND GAPS — what the backend must add to fully match this frontend
// ---------------------------------------------------------------
// Each gap maps to a former UI feature the admin control tower would render but
// the backend does not yet model. Send these to the backend dev.
export const BACKEND_GAPS = [
    {
        feature: 'Multiple QR codes per cluster',
        ui: 'QR modal lists/generates several scannable codes per cluster, each with its own scan count, active toggle and delete.',
        missing: [
            'GET /admin/clusters/:id/qr-codes',
            'POST /admin/clusters/:id/qr-codes        { quantity? }',
            'PATCH /admin/clusters/:id/qr-codes/:qrId  { isActive }',
            'DELETE /admin/clusters/:id/qr-codes/:qrId',
            'each QR maps to a scannable URL + individual scanCount',
        ],
        suggestedRoutes: [
            'GET  /admin/clusters/:id/qr-codes',
            'POST /admin/clusters/:id/qr-codes',
            'PATCH /admin/clusters/:id/qr-codes/:qrId',
            'DELETE /admin/clusters/:id/qr-codes/:qrId',
        ],
    },
    {
        feature: 'Per-QR deal configuration',
        ui: 'Each QR code has its own "Configure" flow choosing which deals it serves (all cluster deals vs a curated subset + slot count).',
        missing: [
            'GET  /admin/clusters/:id/qr-codes/:qrId/config  -> { mode: "all" | "custom", offerIds[], slotCount }',
            'PUT  /admin/clusters/:id/qr-codes/:qrId/config  { mode, offerIds?, slotCount }',
            'deals endpoint for the picker: GET /admin/clusters/:id/offers (shared with pin/unpin)',
        ],
        suggestedRoutes: [
            'GET /admin/clusters/:id/qr-codes/:qrId/config',
            'PUT /admin/clusters/:id/qr-codes/:qrId/config',
        ],
    },
    {
        feature: 'Dynamic QR destination',
        ui: 'Each QR keeps a stable scan code but its destination can be switched from the cluster page to a custom URL, optionally only until a chosen time, then restored to default.',
        missing: [
            'QR record fields: destinationUrl?, validUntil? (null = indefinite; after it, resolve to default)',
            'Redirect rule on the scanned code resolver: if destinationUrl is set and unexpired, land there; else land on the cluster page',
        ],
        suggestedRoutes: [
            'GET  /public/scan/:code  ->  redirect target (default or current destination)',
            'PUT  /admin/clusters/:id/qr-codes/:qrId/destination  { url?, validUntil? }',
            'DELETE /admin/clusters/:id/qr-codes/:qrId/destination  → restore default',
        ],
    },
    {
        feature: 'Per-QR rotation override',
        ui: 'Each QR code can inherit the cluster rotation or override it with its own deal pool + strategy.',
        missing: [
            'GET  /clusters/qr/:qrId/rotation  ->  { inheritCluster, dealPool, rotation }',
            'PATCH /clusters/qr/:qrId/rotation  { inheritCluster?, dealPool?, rotation? }',
        ],
        suggestedRoutes: [
            'GET /clusters/qr/:qrId/rotation',
            'PATCH /clusters/qr/:qrId/rotation',
        ],
    },
    {
        feature: 'Cluster deals: auto-match + pin/unpin',
        ui: 'Deals modal shows auto-matched offers for a cluster and lets admins manually pin/unpin offers.',
        missing: [
            '(IMPLEMENTED — GET /admin/clusters/:id/offers + PATCH /admin/clusters/:id/offers/:offerId)',
        ],
        suggestedRoutes: [],
    },
    {
        feature: 'Branch membership management UI',
        ui: 'Admin should add/remove branches and run auto-assign from the UI.',
        missing: [
            '(IMPLEMENTED — see admin clusters page with Branches modal + Auto-Assign button)',
        ],
        suggestedRoutes: [],
    },
];
