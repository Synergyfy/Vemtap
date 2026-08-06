// =====================
// CLUSTERS & CLUSTER QR DISCOVERY — HYBRID (real backend + local fallback)
// =====================
// The real backend (`modules/clusters`) now provides:
//   GET  /admin/clusters               (list)
//   GET  /admin/clusters/:id           (detail)
//   POST /admin/clusters               (create)
//   PATCH /admin/clusters/:id          (update / QR toggle)
//   DELETE /admin/clusters/:id         (soft delete)
//   POST /admin/clusters/auto-assign   (bulk branch assignment)
//   POST /admin/clusters/:id/branches  (add branch)
//   DELETE /admin/clusters/:id/branches/:branchId (remove branch)
//   Public: /clusters/context/:uniqueCode, /clusters/:uniqueCode/deals
//
// CRUD (`list/get/create/update/remove`) hits the real backend and maps
// responses into the rich UI model below. Where the backend has NO endpoint
// yet, the former mock engine is kept as a LOCAL fallback so the UI keeps
// working — see BACKEND_GAPS at the bottom for what to send to the backend
// dev. `searchMockDeals` remains as a fallback when the public offers feed
// is unreachable.

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
    createdAt: string;
    updatedAt: string;
}

export interface ClusterQrCode {
    id: string;
    clusterId: string;
    code: string;
    scanUrl: string;
    isActive: boolean;
    totalScans: number;
    createdAt: string;
}

/** What scanning a specific QR should show. Mock only — the backend does not
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
 *  'default' points to the cluster's main page; 'custom' redirects to a chosen
 *  URL, optionally only until `expiresAt` then falls back to default. Mock only
 *  — the backend does not yet model dynamic destinations (see BACKEND_GAPS). */
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

export interface ClusterOffersResponse {
    autoMatched: ClusterOfferRow[];
    pinned: ClusterOfferRow[];
    total: number;
}

// ---------------------------------------------------------------
// Mock data model
// ---------------------------------------------------------------

interface MockOffer {
    id: string;
    name: string;
    description: string;
    businessName: string;
    businessSlug: string;
    mainImage: string | null;
    isTrending: boolean;
    state: string;
    city: string;
    lat: number | null;
    lng: number | null;
}

/** Minimal meta for clusters that came from the real backend (used so the
 *  QR modal can resolve the single real uniqueCode-based QR without a backend
 *  "list QR codes" endpoint). */
export interface RealClusterMeta {
    uniqueCode: string;
    qrUrl?: string;
    isActive: boolean;
    totalScans: number;
}

interface MockDb {
    clusters: Cluster[];
    qrCodes: ClusterQrCode[];
    offers: MockOffer[];
    pinnedByCluster: Record<string, string[]>;
    /** keyed by backend cluster id. */
    realClusters?: Record<string, RealClusterMeta>;
    /** keyed by QR code id. Mock per-QR deal config. */
    qrConfigs?: Record<string, ClusterQrConfig>;
    /** keyed by QR code id. Mock per-QR dynamic destination. */
    qrDynamics?: Record<string, ClusterQrDynamic>;
}

const STORAGE_KEY = 'vemtap_clusters_mock_v1';

const uid = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)) +
    Math.random().toString(36).slice(2, 8);

const nowIso = () => new Date().toISOString();

const DEFAULT_QR_DYNAMIC = (qrCodeId: string): ClusterQrDynamic => ({
    qrCodeId,
    mode: 'default',
    url: null,
    expiresAt: null,
});

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const seedOffers: MockOffer[] = [
    {
        id: 'mock-offer-1',
        name: '2-for-1 Jollof Thursday',
        description: 'Buy one jollof plate, get the second free. Every Thursday until 5pm.',
        businessName: 'Naija Pot',
        businessSlug: 'naija-pot',
        mainImage: null,
        isTrending: true,
        state: 'Lagos',
        city: 'Eti-Osa',
        lat: 6.4412,
        lng: 3.4618,
    },
    {
        id: 'mock-offer-2',
        name: 'Free Starter with Mains',
        description: 'Order any main course and receive a free starter of your choice.',
        businessName: 'Kaya Lounge',
        businessSlug: 'kaya-lounge',
        mainImage: null,
        isTrending: false,
        state: 'Lagos',
        city: 'Eti-Osa',
        lat: 6.4281,
        lng: 3.4219,
    },
    {
        id: 'mock-offer-3',
        name: '20% Off Tailored Suits',
        description: 'Flat 20% off all tailored suits this season. In-store only.',
        businessName: 'Silk & Thread',
        businessSlug: 'silk-and-thread',
        mainImage: null,
        isTrending: false,
        state: 'Lagos',
        city: 'Ikeja',
        lat: 6.6018,
        lng: 3.3515,
    },
    {
        id: 'mock-offer-4',
        name: 'Spa Day Package — 35% Off',
        description: 'Full-day spa package including massage, facial and body scrub.',
        businessName: 'The Glow Room',
        businessSlug: 'the-glow-room',
        mainImage: null,
        isTrending: true,
        state: 'Lagos',
        city: 'Ikeja',
        lat: 6.6005,
        lng: 3.3491,
    },
    {
        id: 'mock-offer-5',
        name: 'Happy Hour — Buy 1 Get 1',
        description: 'Unlimited buy-one-get-one on cocktails between 4pm and 7pm daily.',
        businessName: 'Skyline Bar',
        businessSlug: 'skyline-bar',
        mainImage: null,
        isTrending: false,
        state: 'Abuja',
        city: 'Garki',
        lat: 9.058,
        lng: 7.4894,
    },
    {
        id: 'mock-offer-6',
        name: 'Buy 1 Get 1 Coffee',
        description: 'Pick up any two specialty coffees and pay for the first only.',
        businessName: 'Brew & Co',
        businessSlug: 'brew-and-co',
        mainImage: null,
        isTrending: false,
        state: 'Lagos',
        city: 'Eti-Osa',
        lat: 6.4521,
        lng: 3.4633,
    },
    {
        id: 'mock-offer-7',
        name: 'Weekend Brunch Special',
        description: 'Two-course brunch menu for a fixed low price every weekend.',
        businessName: 'Terra Green',
        businessSlug: 'terra-green',
        mainImage: null,
        isTrending: true,
        state: 'Abuja',
        city: 'Wuse',
        lat: 9.0832,
        lng: 7.4796,
    },
];

const seedClusters: Cluster[] = [
    {
        id: 'mock-cluster-nigeria',
        name: 'Nigeria',
        description: 'Nationwide deal collection covering every business on the platform.',
        type: 'country',
        parentId: null,
        country: 'Nigeria',
        state: '',
        city: '',
        area: '',
        latitude: 9.082,
        longitude: 8.6753,
        radiusM: null,
        isActive: true,
        qrCodesCount: 0,
        totalScans: 0,
        autoMatchedOffersCount: 0,
        pinnedOffersCount: 0,
        createdAt: '2026-01-05T09:00:00.000Z',
        updatedAt: '2026-01-05T09:00:00.000Z',
    },
    {
        id: 'mock-cluster-lagos',
        name: 'Lagos State',
        description: 'All active deals from businesses across Lagos.',
        type: 'state',
        parentId: 'mock-cluster-nigeria',
        country: 'Nigeria',
        state: 'Lagos',
        city: '',
        area: '',
        latitude: 6.5244,
        longitude: 3.3792,
        radiusM: null,
        isActive: true,
        qrCodesCount: 0,
        totalScans: 0,
        autoMatchedOffersCount: 0,
        pinnedOffersCount: 0,
        createdAt: '2026-01-12T09:00:00.000Z',
        updatedAt: '2026-01-12T09:00:00.000Z',
    },
    {
        id: 'mock-cluster-lekki',
        name: 'Lekki Phase 1',
        description: 'The premium peninsula — restaurants, lounges and boutiques along Admiralty Way.',
        type: 'market',
        parentId: 'mock-cluster-lagos',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Eti-Osa',
        area: 'Lekki Phase 1',
        latitude: 6.4478,
        longitude: 3.4723,
        radiusM: 2000,
        isActive: true,
        qrCodesCount: 0,
        totalScans: 0,
        autoMatchedOffersCount: 0,
        pinnedOffersCount: 0,
        createdAt: '2026-02-02T09:00:00.000Z',
        updatedAt: '2026-02-02T09:00:00.000Z',
    },
    {
        id: 'mock-cluster-ikeja',
        name: 'Ikeja City Mall',
        description: 'One of the biggest shopping malls in West Africa.',
        type: 'building',
        parentId: 'mock-cluster-lagos',
        country: 'Nigeria',
        state: 'Lagos',
        city: 'Ikeja',
        area: 'Ikeja City Mall',
        latitude: 6.6018,
        longitude: 3.3515,
        radiusM: 1500,
        isActive: true,
        qrCodesCount: 0,
        totalScans: 0,
        autoMatchedOffersCount: 0,
        pinnedOffersCount: 0,
        createdAt: '2026-02-10T09:00:00.000Z',
        updatedAt: '2026-02-10T09:00:00.000Z',
    },
    {
        id: 'mock-cluster-abuja',
        name: 'Abuja',
        description: 'Federal Capital Territory deals and promos.',
        type: 'state',
        parentId: 'mock-cluster-nigeria',
        country: 'Nigeria',
        state: 'Abuja',
        city: '',
        area: '',
        latitude: 9.0765,
        longitude: 7.3986,
        radiusM: null,
        isActive: true,
        qrCodesCount: 0,
        totalScans: 0,
        autoMatchedOffersCount: 0,
        pinnedOffersCount: 0,
        createdAt: '2026-02-18T09:00:00.000Z',
        updatedAt: '2026-02-18T09:00:00.000Z',
    },
];

const seedQrCodes: ClusterQrCode[] = [
    { id: 'mock-qr-lekki-1', clusterId: 'mock-cluster-lekki', code: 'LEK-001', scanUrl: '', isActive: true, totalScans: 124, createdAt: '2026-02-03T09:00:00.000Z' },
    { id: 'mock-qr-lekki-2', clusterId: 'mock-cluster-lekki', code: 'LEK-002', scanUrl: '', isActive: true, totalScans: 87, createdAt: '2026-02-03T09:00:00.000Z' },
    { id: 'mock-qr-ng-1', clusterId: 'mock-cluster-nigeria', code: 'NG-0001', scanUrl: '', isActive: true, totalScans: 542, createdAt: '2026-01-06T09:00:00.000Z' },
    { id: 'mock-qr-ikeja-1', clusterId: 'mock-cluster-ikeja', code: 'ICM-001', scanUrl: '', isActive: true, totalScans: 63, createdAt: '2026-02-11T09:00:00.000Z' },
];

const seedPinnedByCluster: Record<string, string[]> = {
    // Cross-location manual override: Ikeja suit offer pinned to Lekki Phase 1.
    'mock-cluster-lekki': ['mock-offer-3'],
};

const buildSeed = (): MockDb => ({ clusters: seedClusters, qrCodes: seedQrCodes, offers: seedOffers, pinnedByCluster: seedPinnedByCluster });

// ---------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------

const loadDb = (): MockDb => {
    if (typeof window !== 'undefined') {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as MockDb;
                if (parsed && Array.isArray(parsed.clusters)) return parsed;
            }
        } catch {
            // fall through to reseed
        }
    }
    return buildSeed();
};

const saveDb = (db: MockDb) => {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        } catch {
            // storage unavailable — mock still works in-memory
        }
    }
};

const delay = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

// ---------------------------------------------------------------
// Auto-match engine (mirrors the planned backend behaviour)
// ---------------------------------------------------------------

const normalize = (v?: string) => (v || '').trim().toLowerCase();

const computeMatchedOffers = (db: MockDb, cluster: Cluster): { autoMatched: MockOffer[]; matchReason: Record<string, string> } => {
    const reasonMap: Record<string, string> = {};
    const pinnedIds = new Set(db.pinnedByCluster[cluster.id] || []);

    const matches = db.offers.filter(offer => {
        if (pinnedIds.has(offer.id)) return false;
        return offer.state && normalize(offer.state) === normalize(cluster.state) &&
            (!cluster.city || normalize(offer.city) === normalize(cluster.city));
    });

    // Near-field (GPS radius) — adds offers even if the text location differs.
    if (cluster.latitude != null && cluster.longitude != null) {
        const radiusKm = (cluster.radiusM || 2000) / 1000;
        db.offers.forEach(offer => {
            if (pinnedIds.has(offer.id)) return;
            if (offer.lat == null || offer.lng == null) return;
            const dist = distanceKm(cluster.latitude!, cluster.longitude!, offer.lat, offer.lng);
            if (dist <= radiusKm) {
                if (!matches.some(m => m.id === offer.id)) {
                    matches.push(offer);
                    reasonMap[offer.id] = `${Math.round(dist * 10) / 10} km away`;
                }
            }
        });
    }

    matches.forEach(offer => {
        if (!reasonMap[offer.id]) {
            reasonMap[offer.id] = [cluster.city, cluster.state].filter(Boolean).join(' · ');
        }
    });

    return { autoMatched: matches, matchReason: reasonMap };
};

const toOfferRow = (db: MockDb, offer: MockOffer, reason?: string) => ({
    id: offer.id,
    name: offer.name,
    description: offer.description,
    businessName: offer.businessName,
    businessSlug: offer.businessSlug,
    mainImage: offer.mainImage,
    isTrending: offer.isTrending,
    state: offer.state,
    city: offer.city,
    matchReason: reason,
});

// ---------------------------------------------------------------
// Public mock helpers
// ---------------------------------------------------------------

/** Searches the mocked deal catalogue (used as fallback when the real public
 *  offers endpoint is unreachable). Returns DealOffer-shaped rows. */
export const searchMockDeals = (query: string) => {
    const q = normalize(query);
    const db = loadDb();
    return db.offers
        .filter(o => !q || normalize(o.name).includes(q) || normalize(o.businessName).includes(q))
        .map(o => ({
            id: o.id,
            name: o.name,
            description: o.description,
            mainImage: o.mainImage,
            isTrending: o.isTrending,
            status: 'active',
            pricingType: 'percentage_discount',
            discountValue: 20,
            fixedPrice: null,
            calculatedPrice: 0,
            claimedCount: 0,
            maxClaims: 100,
            startDate: null,
            endDate: null,
            business: { id: o.id + '-biz', name: o.businessName, slug: o.businessSlug },
            businessId: o.id + '-biz',
            branchId: o.id + '-branch',
        }));
};

// ---------------------------------------------------------------
// Admin API (hybrid: real backend + local mock fallback)
// ---------------------------------------------------------------

// ---- Real backend DTOs (internal) -------------------------------
interface BBackendCluster {
    id: string;
    name: string;
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

/** Map a real backend cluster into the rich UI model. The backend has no
 *  hierarchy/type/pinning yet, so those default lower — see BACKEND_GAPS. */
const toRichCluster = (b: BBackendCluster): Cluster => ({
    id: b.id,
    name: b.name,
    description: b.description || '',
    type: 'market',
    parentId: null,
    country: '',
    state: '',
    city: '',
    area: '',
    latitude: b.latitude != null ? Number(b.latitude) : null,
    longitude: b.longitude != null ? Number(b.longitude) : null,
    radiusM: b.radiusMeters != null ? Number(b.radiusMeters) : null,
    isActive: b.isActive,
    uniqueCode: b.uniqueCode,
    qrUrl: `https://vemtap.com/c/${b.uniqueCode}`,
    qrCodesCount: b.qrIsActive ? 1 : 0,
    totalScans: Number(b.scanCount) || 0,
    autoMatchedOffersCount: Number(b.activeOfferCount) || 0,
    pinnedOffersCount: 0,
    createdAt: b.createdAt,
    updatedAt: b.createdAt,
});

/** Convert the rich UI dto to the backend Create/Update payload. The backend
 *  only accepts: name, description, latitude, longitude, radiusMeters,
 *  isActive, qrIsActive. (Hierarchy fields have no backend column — see gaps.) */
const toBackendPayload = (data: Partial<CreateClusterDto>) => ({
    name: data.name,
    description: data.description,
    latitude: data.latitude ?? undefined,
    longitude: data.longitude ?? undefined,
    radiusMeters: data.radiusM ?? undefined,
    isActive: data.isActive ?? undefined,
    qrIsActive: data.qrIsActive ?? undefined,
});

export const adminClustersApi = {
    // -> GET /admin/clusters
    list: async () => {
        try {
            const res = await api.get('/admin/clusters', { params: { limit: 100 } });
            const items: BBackendCluster[] = Array.isArray(res) ? res : res?.data || [];
            // Cache real meta so the QR modal can resolve the single uniqueCode.
            const db = loadDb();
            db.realClusters = {};
            items.forEach(b => {
                db.realClusters![b.id] = {
                    uniqueCode: b.uniqueCode,
                    qrUrl: `https://vemtap.com/c/${b.uniqueCode}`,
                    isActive: b.qrIsActive && b.isActive,
                    totalScans: b.scanCount,
                };
            });
            saveDb(db);
            return items.map(toRichCluster);
        } catch {
            // Backend unreachable / no token → seeded demo data (former behaviour).
            const db = loadDb();
            await delay();
            return db.clusters.map(cluster => {
                const pinnedIds = db.pinnedByCluster[cluster.id] || [];
                const qr = db.qrCodes.filter(q => q.clusterId === cluster.id);
                const { autoMatched } = computeMatchedOffers(db, cluster);
                return {
                    ...cluster,
                    qrCodesCount: qr.length,
                    totalScans: qr.reduce((sum, q) => sum + q.totalScans, 0),
                    autoMatchedOffersCount: autoMatched.length,
                    pinnedOffersCount: pinnedIds.length,
                };
            });
        }
    },

    // -> GET /admin/clusters/:id
    get: async (id: string) => {
        try {
            const b = await api.get(`/admin/clusters/${id}`);
            return toRichCluster(b as BBackendCluster);
        } catch {
            const db = loadDb();
            await delay();
            return db.clusters.find(c => c.id === id) || null;
        }
    },

    // -> POST /admin/clusters
    create: async (data: CreateClusterDto) => {
        try {
            const b = await api.post('/admin/clusters', toBackendPayload(data));
            return toRichCluster(b as BBackendCluster);
        } catch {
            const db = loadDb();
            await delay();
            const cluster: Cluster = {
                id: uid(),
                name: data.name,
                description: data.description || '',
                type: data.type,
                parentId: data.parentId || null,
                country: data.country || '',
                state: data.state || '',
                city: data.city || '',
                area: data.area || '',
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
                radiusM: data.radiusM ?? null,
                isActive: data.isActive ?? true,
                qrCodesCount: 0,
                totalScans: 0,
                autoMatchedOffersCount: 0,
                pinnedOffersCount: 0,
                createdAt: nowIso(),
                updatedAt: nowIso(),
            };
            db.clusters.push(cluster);
            saveDb(db);
            return cluster;
        }
    },

    // -> PATCH /admin/clusters/:id
    update: async (id: string, data: UpdateClusterDto) => {
        try {
            const b = await api.patch(`/admin/clusters/${id}`, toBackendPayload(data));
            return toRichCluster(b as BBackendCluster);
        } catch {
            const db = loadDb();
            await delay();
            const index = db.clusters.findIndex(c => c.id === id);
            if (index === -1) throw new Error('Cluster not found');
            db.clusters[index] = { ...db.clusters[index], ...data, id, updatedAt: nowIso() };
            saveDb(db);
            return db.clusters[index];
        }
    },

    // -> DELETE /admin/clusters/:id
    remove: async (id: string) => {
        try {
            await api.delete(`/admin/clusters/${id}`);
            return { success: true };
        } catch {
            const db = loadDb();
            await delay();
            db.clusters = db.clusters.filter(c => c.id !== id);
            db.qrCodes = db.qrCodes.filter(q => q.clusterId !== id);
            delete db.pinnedByCluster[id];
            saveDb(db);
            return { success: true };
        }
    },

    // -> Real backend (added for parity; not yet surfaced in the former UI):
    //    POST /admin/clusters/auto-assign
    runningAutoAssign: async (payload: { dryRun?: boolean }) => {
        return api.post('/admin/clusters/auto-assign', payload);
    },
    //    POST /admin/clusters/:id/branches
    addBranchToBackend: async (id: string, branchId: string) => {
        return api.post(`/admin/clusters/${id}/branches`, { branchId });
    },
    //    DELETE /admin/clusters/:id/branches/:branchId
    removeBranchFromBackend: async (id: string, branchId: string) => {
        return api.delete(`/admin/clusters/${id}/branches/${branchId}`);
    },

    // -> GET /admin/clusters/:id/qr-codes
    // BACKEND GAP: no per-cluster QR-code listing endpoint. For real backend
    // clusters we resolve the single uniqueCode-based QR from `list()`; the
    // multi-code gallery below is the local fallback / demo behaviour.
    listQrCodes: async (clusterId: string) => {
        const db = loadDb();
        const real = db.realClusters?.[clusterId];
        if (real) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            return [{
                id: `${clusterId}-qr`,
                clusterId,
                code: real.uniqueCode,
                scanUrl: real.qrUrl || `${origin}/c/${real.uniqueCode}`,
                isActive: real.isActive,
                totalScans: real.totalScans,
                createdAt: '',
            } as ClusterQrCode];
        }
        await delay();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return db.qrCodes
            .filter(q => q.clusterId === clusterId)
            .map(q => ({ ...q, scanUrl: q.scanUrl || `${origin}/tap/clusters/${q.code}` }));
    },

    // -> POST /admin/clusters/:id/qr-codes
    // BACKEND GAP: backend only stores ONE QR per cluster (the uniqueCode).
    // Generating multiple codes is a LOCAL demo feature — send the endpoint
    // request to the backend dev to match.
    generateQrCodes: async (clusterId: string, data: { quantity?: number; notes?: string }) => {
        const db = loadDb();
        await delay();
        const quantity = Math.max(1, Math.min(100, data.quantity || 1));
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const created: ClusterQrCode[] = [];
        for (let i = 0; i < quantity; i++) {
            const code = `CLU-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
            const qr: ClusterQrCode = {
                id: uid(),
                clusterId,
                code,
                scanUrl: `${origin}/tap/clusters/${code}`,
                isActive: true,
                totalScans: 0,
                createdAt: nowIso(),
            };
            db.qrCodes.push(qr);
            created.push(qr);
        }
        saveDb(db);
        return created;
    },

    // -> PATCH /admin/clusters/:id/qr-codes/:qrId
    setQrCodeActive: async (clusterId: string, qrId: string, isActive: boolean) => {
        const db = loadDb();
        const real = db.realClusters?.[clusterId];
        if (real) {
            try {
                // Real backend: toggling the QR is PATCH /admin/clusters/:id { qrIsActive }
                const res = await api.patch(`/admin/clusters/${clusterId}`, { qrIsActive: isActive });
                const active = res?.qrIsActive ?? isActive;
                real.isActive = active;
                saveDb(db);
                return {
                    id: qrId,
                    clusterId,
                    code: real.uniqueCode,
                    scanUrl: real.qrUrl || '',
                    isActive: active,
                    totalScans: real.totalScans,
                    createdAt: '',
                } as ClusterQrCode;
            } catch {
                // fall through to local demo behaviour
            }
        }
        await delay();
        const qr = db.qrCodes.find(q => q.clusterId === clusterId && q.id === qrId);
        if (qr) qr.isActive = isActive;
        saveDb(db);
        return qr || null;
    },

    // -> DELETE /admin/clusters/:id/qr-codes/:qrId
    // BACKEND GAP: no per-QR delete endpoint. Local demo behaviour only.
    removeQrCode: async (clusterId: string, qrId: string) => {
        const db = loadDb();
        await delay();
        db.qrCodes = db.qrCodes.filter(q => !(q.clusterId === clusterId && q.id === qrId));
        if (db.qrConfigs) delete db.qrConfigs[qrId];
        saveDb(db);
        return { success: true };
    },

    // -> Create a single QR code (with a per-QR config) — MOCK
    // BACKEND GAP: per-QR deal configuration has no backend endpoint yet.
    createQrCode: async (clusterId: string) => {
        const db = loadDb();
        await delay();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const code = `CLU-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.floor(10 + Math.random() * 90)}`;
        const qr: ClusterQrCode = {
            id: uid(),
            clusterId,
            code,
            scanUrl: `${origin}/tap/clusters/${code}`,
            isActive: true,
            totalScans: 0,
            createdAt: nowIso(),
        };
        db.qrCodes.push(qr);
        db.qrConfigs = db.qrConfigs || {};
        db.qrConfigs[qr.id] = { mode: 'all', offerIds: [], slotCount: 12 };
        saveDb(db);
        return qr;
    },

    // -> Get the per-QR deal config — MOCK
    getQrConfig: async (qrCodeId: string): Promise<ClusterQrConfig> => {
        const db = loadDb();
        await delay();
        return db.qrConfigs?.[qrCodeId] || { mode: 'all', offerIds: [], slotCount: 12 };
    },

    // -> Save the per-QR deal config — MOCK
    saveQrConfig: async (qrCodeId: string, config: ClusterQrConfig): Promise<ClusterQrConfig> => {
        const db = loadDb();
        await delay();
        db.qrConfigs = db.qrConfigs || {};
        db.qrConfigs[qrCodeId] = config;
        saveDb(db);
        return config;
    },

    // -> Deal options available to configure a QR with — MOCK
    // BACKEND GAP: picks from all mock offers; the backend should scope the
    // offer pool per cluster (see Cluster deals gap above).
    getQrOfferOptions: async (): Promise<ClusterOfferRow[]> => {
        const db = loadDb();
        await delay();
        return db.offers.map(o => toOfferRow(db, o, ''));
    },

    // ------------------------------------------------------------------
    // Dynamic QR destinations — MOCK
    // BACKEND GAP: QR codes are static artifacts today. To support dynamic
    // redirects the backend would need a per-QR "destination" + "valid_until"
    // on the QR record (or a small lookup table keyed by scan code) plus a
    // redirect rule when a scanned code resolves. See BACKEND_GAPS.
    // ------------------------------------------------------------------

    getQrDynamic: async (qrCodeId: string): Promise<ClusterQrDynamic> => {
        const db = loadDb();
        await delay();
        const cfg = db.qrDynamics?.[qrCodeId] || DEFAULT_QR_DYNAMIC(qrCodeId);
        if (cfg.mode === 'custom' && cfg.expiresAt && Date.parse(cfg.expiresAt) <= Date.now()) {
            const reset: ClusterQrDynamic = { qrCodeId, mode: 'default', url: null, expiresAt: null };
            db.qrDynamics = db.qrDynamics || {};
            db.qrDynamics[qrCodeId] = reset;
            saveDb(db);
            return reset;
        }
        return cfg;
    },

    setDynamicToDefault: async (qrCodeId: string): Promise<ClusterQrDynamic> => {
        const db = loadDb();
        await delay();
        const reset: ClusterQrDynamic = { qrCodeId, mode: 'default', url: null, expiresAt: null };
        db.qrDynamics = db.qrDynamics || {};
        db.qrDynamics[qrCodeId] = reset;
        saveDb(db);
        return reset;
    },

    setDynamicUrl: async (qrCodeId: string, url: string, expiresAt?: string | null): Promise<ClusterQrDynamic> => {
        const db = loadDb();
        await delay();
        const cfg: ClusterQrDynamic = { qrCodeId, mode: 'custom', url, expiresAt: expiresAt || null };
        db.qrDynamics = db.qrDynamics || {};
        db.qrDynamics[qrCodeId] = cfg;
        saveDb(db);
        return cfg;
    },

    // -> GET /admin/clusters/:id/offers  =>  { autoMatched, pinned, total }
    // BACKEND GAP: no admin endpoint lists a cluster's auto-matched/pinned
    // offers, and the backend auto-assigns BRANCHES (not offers). This modal
    // keeps the former local auto-match engine as a demo until parity exists.
    listOffers: async (clusterId: string): Promise<ClusterOffersResponse> => {
        const db = loadDb();
        await delay();
        const cluster = db.clusters.find(c => c.id === clusterId);
        if (!cluster) return { autoMatched: [], pinned: [], total: 0 };

        const { autoMatched, matchReason } = computeMatchedOffers(db, cluster);
        const pinnedIds = db.pinnedByCluster[clusterId] || [];
        const pinned = pinnedIds
            .map(id => db.offers.find(o => o.id === id))
            .filter((o): o is MockOffer => !!o)
            .map(o => toOfferRow(db, o, 'pinned manually'));

        return {
            autoMatched: autoMatched.map(o => toOfferRow(db, o, matchReason[o.id])),
            pinned,
            total: autoMatched.length + pinned.length,
        };
    },

    // -> PATCH /admin/clusters/:id/offers/:offerId  =>  { pinned: boolean }
    // BACKEND GAP: no pin/unpin endpoint. Local demo behaviour only.
    setOfferPinned: async (clusterId: string, offerId: string, pinned: boolean) => {
        const db = loadDb();
        await delay();
        const list = db.pinnedByCluster[clusterId] || (db.pinnedByCluster[clusterId] = []);
        if (pinned && !list.includes(offerId)) {
            list.push(offerId);
        } else if (!pinned) {
            db.pinnedByCluster[clusterId] = list.filter(id => id !== offerId);
        }
        saveDb(db);
        return { pinned };
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
};

// ---------------------------------------------------------------
// BACKEND GAPS — what the backend must add to fully match this frontend
// ---------------------------------------------------------------
// Each gap maps to a former UI feature the admin control tower renders but the
// backend does not yet model. Send these to the backend dev.
export const BACKEND_GAPS = [
    {
        feature: 'Cluster hierarchy & type',
        ui: 'Tree groups clusters into Country > State > Market / Building > Custom (parentId + type + country/state/city/area on CreateClusterDto).',
        missing: [
            'Cluster entity fields: type (country|state|market|building|custom), parentId, country, state, city, area',
            'GET /admin/clusters + GET /admin/clusters/:id return these fields',
            'CreateClusterDto/UpdateClusterDto accept type, parentId, country, state, city, area',
        ],
        suggestedRoutes: [],
    },
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
        feature: 'Cluster deals: auto-match + pin/unpin',
        ui: 'Deals modal shows auto-matched offers for a cluster and lets admins manually pin/unpin offers.',
        missing: [
            'GET /admin/clusters/:id/offers  -> { autoMatched[], pinned[], total }',
            'PATCH /admin/clusters/:id/offers/:offerId  -> { pinned }',
        ],
        suggestedRoutes: [
            'GET /admin/clusters/:id/offers',
            'PATCH /admin/clusters/:id/offers/:offerId',
        ],
    },
    {
        feature: 'Per-QR deal configuration',
        ui: 'Each QR code has its own "Configure" flow choosing which deals it serves (all cluster deals vs a curated subset + slot count).',
        missing: [
            'GET  /admin/clusters/:id/qr-codes/:qrId/config  -> { mode: "all" | "custom", offerIds[], slotCount }',
            'PUT  /admin/clusters/:id/qr-codes/:qrId/config  { mode, offerIds?, slotCount }',
            'deals endpoint for the picker: GET /admin/clusters/:id/offers (shared with pin/unpin gap)',
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
        feature: 'Branch membership management UI',
        ui: 'Admin should add/remove branches and run auto-assign from the UI.',
        missing: [
            '(Supported in backend — see below)',
        ],
        suggestedRoutes: [],
    },
];

// ------------------------------------------------------------------
// The following are ALREADY supported by the backend and are surfaced in
// `adminClustersApi` (but not yet wired into the former UI):
//   POST /admin/clusters/auto-assign
//   POST /admin/clusters/:id/branches
//   DELETE /admin/clusters/:id/branches/:branchId
// ------------------------------------------------------------------
