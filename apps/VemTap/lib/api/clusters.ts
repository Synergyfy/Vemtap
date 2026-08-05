// =====================
// CLUSTERS (Admin) — TEMPORARY MOCK
// =====================
// There is no backend for clusters yet, so this module is fully mocked:
// data is seeded once, persisted to localStorage, and every call simulates
// network latency. When the real backend lands, replace the bodies of the
// `adminClustersApi` methods with the `api.get/post/patch/delete` calls
// (endpoints are noted on each method) and delete `searchMockDeals`.
// The exported types are the contract the UI already uses.

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

interface MockDb {
    clusters: Cluster[];
    qrCodes: ClusterQrCode[];
    offers: MockOffer[];
    pinnedByCluster: Record<string, string[]>;
}

const STORAGE_KEY = 'vemtap_clusters_mock_v1';

const uid = () =>
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)) +
    Math.random().toString(36).slice(2, 8);

const nowIso = () => new Date().toISOString();

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
// Admin API (mock implementation)
// ---------------------------------------------------------------

export const adminClustersApi = {
    // -> GET /admin/clusters
    list: async () => {
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
    },

    // -> GET /admin/clusters/:id
    get: async (id: string) => {
        const db = loadDb();
        await delay();
        return db.clusters.find(c => c.id === id) || null;
    },

    // -> POST /admin/clusters
    create: async (data: CreateClusterDto) => {
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
    },

    // -> PATCH /admin/clusters/:id
    update: async (id: string, data: UpdateClusterDto) => {
        const db = loadDb();
        await delay();
        const index = db.clusters.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Cluster not found');
        db.clusters[index] = { ...db.clusters[index], ...data, id, updatedAt: nowIso() };
        saveDb(db);
        return db.clusters[index];
    },

    // -> DELETE /admin/clusters/:id
    remove: async (id: string) => {
        const db = loadDb();
        await delay();
        db.clusters = db.clusters.filter(c => c.id !== id);
        db.qrCodes = db.qrCodes.filter(q => q.clusterId !== id);
        delete db.pinnedByCluster[id];
        saveDb(db);
        return { success: true };
    },

    // -> GET /admin/clusters/:id/qr-codes
    listQrCodes: async (clusterId: string) => {
        const db = loadDb();
        await delay();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return db.qrCodes
            .filter(q => q.clusterId === clusterId)
            .map(q => ({ ...q, scanUrl: q.scanUrl || `${origin}/tap/clusters/${q.code}` }));
    },

    // -> POST /admin/clusters/:id/qr-codes
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
        await delay();
        const qr = db.qrCodes.find(q => q.clusterId === clusterId && q.id === qrId);
        if (qr) qr.isActive = isActive;
        saveDb(db);
        return qr || null;
    },

    // -> DELETE /admin/clusters/:id/qr-codes/:qrId
    removeQrCode: async (clusterId: string, qrId: string) => {
        const db = loadDb();
        await delay();
        db.qrCodes = db.qrCodes.filter(q => !(q.clusterId === clusterId && q.id === qrId));
        saveDb(db);
        return { success: true };
    },

    // -> GET /admin/clusters/:id/offers  =>  { autoMatched, pinned, total }
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
