// =============================================================================
// SMART DEAL ROTATOR — ISOLATED MOCK STATE (demo only)
// =============================================================================
// Everything in this file exists purely so the UI can be demonstrated before
// the backend is live. It must NOT be confused with production data:
//   - Deal catalogues are deterministically generated per cluster (seeded PRNG).
//   - Config/eligibility/QR overrides persist to localStorage under a dedicated
//     key so the manual-override demo survives a refresh.
//
// The backend team replaces `services/rotator/api.ts` internals — never this
// file — when real endpoints exist.
// -----------------------------------------------------------------------------

import type {
    RotationConfig,
    RotatorDeal,
    DealStatus,
    RotationAnalytics,
    RotationPreview,
    DealEligibility,
    QrRotationConfig,
    GlobalRotationDefaults,
} from './types';

import { DEFAULT_GLOBAL_ROTATION, DEFAULT_ROTATION_WINDOW_SECONDS } from './types';

const STORAGE_KEY = 'vemtap_rotator_mock_v1';

// -----------------------------------------------------------------------------
// Seeded PRNG so every cluster has a stable, realistic-looking catalogue.
// -----------------------------------------------------------------------------

const hashString = (str: string): number => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

const mulberry32 = (seed: number) => {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const range = (rng: () => number, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

// -----------------------------------------------------------------------------
// Demo catalogue names
// -----------------------------------------------------------------------------

const BUSINESSES: Array<{ name: string; slug: string }> = [
    { name: 'Naija Pot', slug: 'naija-pot' },
    { name: 'Kaya Lounge', slug: 'kaya-lounge' },
    { name: 'Silk & Thread', slug: 'silk-and-thread' },
    { name: 'The Glow Room', slug: 'the-glow-room' },
    { name: 'Skyline Bar', slug: 'skyline-bar' },
    { name: 'Brew & Co', slug: 'brew-and-co' },
    { name: 'Terra Green', slug: 'terra-green' },
    { name: 'Clover Pharmacy', slug: 'clover-pharmacy' },
    { name: 'Urban Fit', slug: 'urban-fit' },
    { name: 'Aroma Bistro', slug: 'aroma-bistro' },
    { name: 'Studio Lens', slug: 'studio-lens' },
    { name: 'Petal Florist', slug: 'petal-florist' },
    { name: 'Drive Mart', slug: 'drive-mart' },
    { name: 'Coco Spa', slug: 'coco-spa' },
    { name: 'Paper & Co', slug: 'paper-and-co' },
    { name: 'Volt Gadgets', slug: 'volt-gadgets' },
    { name: 'Green Bowl', slug: 'green-bowl' },
    { name: 'The Tailor Shop', slug: 'the-tailor-shop' },
];

const CATEGORIES: Array<{ id: string; name: string }> = [
    { id: 'cat-food', name: 'Food & Drink' },
    { id: 'cat-fashion', name: 'Fashion' },
    { id: 'cat-beauty', name: 'Beauty & Spa' },
    { id: 'cat-health', name: 'Health & Wellness' },
    { id: 'cat-services', name: 'Services' },
    { id: 'cat-tech', name: 'Tech & Gadgets' },
    { id: 'cat-home', name: 'Home & Living' },
];

const DEAL_TITLES: Array<{ name: string; categoryId: string }> = [
    { name: '2-for-1 Jollof Thursday', categoryId: 'cat-food' },
    { name: 'Free Starter with Mains', categoryId: 'cat-food' },
    { name: '20% Off Tailored Suits', categoryId: 'cat-fashion' },
    { name: 'Spa Day Package — 35% Off', categoryId: 'cat-beauty' },
    { name: 'Happy Hour Buy 1 Get 1', categoryId: 'cat-food' },
    { name: 'Buy 1 Get 1 Coffee', categoryId: 'cat-food' },
    { name: 'Weekend Brunch Special', categoryId: 'cat-food' },
    { name: 'Blood Sugar Screening', categoryId: 'cat-health' },
    { name: 'First Class Free', categoryId: 'cat-beauty' },
    { name: 'Resistance Training Bundle', categoryId: 'cat-health' },
    { name: 'Loyalty Punch Card', categoryId: 'cat-services' },
    { name: 'Mystery Meal Box', categoryId: 'cat-food' },
    { name: 'Portrait Shoot — 15% Off', categoryId: 'cat-services' },
    { name: 'Same-Day Flower Delivery', categoryId: 'cat-home' },
    { name: 'Student Discount Day', categoryId: 'cat-tech' },
    { name: 'Deep Tissue Therapy', categoryId: 'cat-beauty' },
    { name: 'Accessory Bundle Deal', categoryId: 'cat-fashion' },
    { name: 'Phone Screen Batch', categoryId: 'cat-tech' },
];

const now = Date.now();
const iso = (d: Date) => d.toISOString();

const daysFromNow = (n: number) => iso(new Date(now + n * 24 * 60 * 60 * 1000));

// -----------------------------------------------------------------------------
// Per-cluster catalogue generation
// -----------------------------------------------------------------------------

export interface ClusterCatalogue {
    businesses: number;
    deals: RotatorDeal[];
    activeDeals: number;
    eligibleDeals: number;
}

const buildStatus = (rng: () => number): DealStatus => {
    // Keep the large majority active so the "automatic first" story holds.
    const r = rng();
    if (r < 0.72) return 'active';
    if (r < 0.82) return 'scheduled';
    if (r < 0.9) return 'expired';
    return 'inactive';
};

const makeDeal = (rng: () => number, index: number, seedOffset: number): RotatorDeal => {
    const title = DEAL_TITLES[(index + seedOffset) % DEAL_TITLES.length];
    const category = CATEGORIES.find(c => c.id === title.categoryId)!;
    const business = BUSINESSES[(index * 3 + seedOffset) % BUSINESSES.length];
    const status = buildStatus(rng);
    const isTrending = rng() < 0.2;
    const expired = status === 'expired' || status === 'scheduled';
    return {
        id: `rot-deal-${seedOffset}-${index}`,
        name: title.name,
        description: `A curated ${category.name.toLowerCase()} offer for customers scanning this cluster.`,
        mainImage: null,
        isTrending,
        businessId: `rot-biz-${seedOffset}-${index % 6}`,
        businessName: business.name,
        businessSlug: business.slug,
        branchId: `rot-branch-${seedOffset}-${index % 9}`,
        categoryId: category.id,
        category: category.name,
        status,
        startDate: expired ? daysFromNow(-20) : daysFromNow(-3),
        endDate: status === 'expired' ? daysFromNow(-2) : daysFromNow(14 + (index % 20)),
    };
};

export const buildCatalogue = (clusterId: string): ClusterCatalogue => {
    const rng = mulberry32(hashString(clusterId || 'default'));
    const count = range(rng, 26, 42);
    const seedOffset = hashString(clusterId) % DEAL_TITLES.length;
    const deals = Array.from({ length: count }, (_, i) => makeDeal(rng, i, seedOffset));
    const active = deals.filter(d => d.status === 'active');
    return {
        businesses: Math.max(8, new Set(deals.map(d => d.businessId)).size),
        deals,
        activeDeals: active.length,
        eligibleDeals: active.length,
    };
};

// -----------------------------------------------------------------------------
// Defaults / persistence
// -----------------------------------------------------------------------------

export const defaultConfig = (clusterId: string, firstDeals: string[] = []): RotationConfig => ({
    clusterId,
    status: 'active',
    eligibility: { mode: 'automatic', included: [], excluded: [] },
    rotation: { mode: 'automatic', strategy: 'balanced' },
    weights: Object.fromEntries(firstDeals.map(id => [id, 1])),
    schedules: [],
    featuredSlots: { mode: 'automatic', count: 5 },
    frequency: { mode: 'automatic', maxViewsPerCustomerPerDay: 3 },
    rotationWindowSeconds: DEFAULT_ROTATION_WINDOW_SECONDS,
    updatedAt: iso(new Date()),
});

interface MockDb {
    configs: Record<string, RotationConfig>;
    qr: Record<string, QrRotationConfig>;
    defaults?: GlobalRotationDefaults;
}

const loadDb = (): MockDb => {
    if (typeof window !== 'undefined') {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as MockDb;
                if (parsed && typeof parsed === 'object' && parsed.configs) return parsed;
            }
        } catch {
            // fall through to fresh mock state
        }
    }
    return { configs: {}, qr: {}, defaults: undefined };
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

export const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

// -----------------------------------------------------------------------------
// Mock accessors used by the hybrid api boundary
// -----------------------------------------------------------------------------

export const getMockConfig = (clusterId: string, deals: RotatorDeal[]): RotationConfig => {
    const db = loadDb();
    const existing = db.configs[clusterId];
    const ids = deals.map(d => d.id);
    if (!existing) {
        db.configs[clusterId] = defaultConfig(clusterId, ids);
        saveDb(db);
        return db.configs[clusterId];
    }
    // Pad stored configs with any fields added after they were last saved
    // (e.g. rotationWindowSeconds) so old persisted values never leak NaN/undefined.
    const base = defaultConfig(clusterId, ids);
    const padded: RotationConfig = { ...base, ...existing, clusterId };
    if (JSON.stringify(padded) !== JSON.stringify(existing)) {
        db.configs[clusterId] = padded;
        saveDb(db);
        return padded;
    }
    // Keep weights aligned with the catalogue without losing manual edits.
    const mergedWeights: Record<string, number> = {};
    ids.forEach(id => { mergedWeights[id] = existing.weights[id] ?? 1; });
    if (JSON.stringify(existing.weights) !== JSON.stringify(mergedWeights)) {
        existing.weights = mergedWeights;
        saveDb(db);
    }
    return existing;
};

export const saveMockConfig = (config: RotationConfig): RotationConfig => {
    const db = loadDb();
    db.configs[config.clusterId] = config;
    saveDb(db);
    return config;
};

export type MockRotationMutation = Partial<Omit<RotationConfig, 'clusterId' | 'updatedAt'>>;

export const patchMockConfig = (
    clusterId: string,
    patch: MockRotationMutation,
    deals: RotatorDeal[],
): RotationConfig => {
    const base = getMockConfig(clusterId, deals);
    const next: RotationConfig = {
        ...base,
        ...patch,
        clusterId,
        updatedAt: iso(new Date()),
    };
    return saveMockConfig(next);
};

// -----------------------------------------------------------------------------
// Eligibility
// -----------------------------------------------------------------------------

export const computeEligibility = (deal: RotatorDeal, config: RotationConfig): DealEligibility => {
    const inExcluded = config.eligibility.excluded.includes(deal.id);
    const inIncluded = config.eligibility.included.includes(deal.id);
    const matchesPool =
        config.eligibility.mode === 'automatic'
            ? deal.status !== 'expired'
            : inIncluded || (deal.status !== 'expired' && !inExcluded);

    const checks = [
        { label: 'Business active', passed: true, detail: 'Business is active on the platform' },
        { label: 'Deal active', passed: deal.status === 'active', detail: deal.status === 'active' ? 'Deal is active' : `Deal status: ${deal.status}` },
        { label: 'Cluster match', passed: true, detail: 'Business has a branch in this cluster' },
        { label: 'Not expired', passed: deal.status !== 'expired', detail: deal.status === 'expired' ? 'Deal end date has passed' : 'Deal is within its validity window' },
        { label: 'Schedule valid', passed: true, detail: 'No manual schedule blocks this deal' },
        { label: 'Frequency eligible', passed: true, detail: 'Within per-customer frequency caps' },
    ];
    const eligible = checks.every(c => c.passed) && matchesPool;
    return {
        dealId: deal.id,
        eligible,
        reason: eligible
            ? 'Deal meets all eligibility rules.'
            : !checks.every(c => c.passed)
                ? checks.find(c => !c.passed)?.label || 'Deal failed eligibility.'
                : 'Excluded from rotation for this cluster.',
        checks,
    };
};

// -----------------------------------------------------------------------------
// Preview simulation
// -----------------------------------------------------------------------------

export const simulatePreview = (
    clusterId: string,
    deals: RotatorDeal[],
    config: RotationConfig,
    seed: number,
): RotationPreview => {
    const pool = deals.filter(d => computeEligibility(d, config).eligible);
    const slots = config.featuredSlots.mode === 'manual' ? Math.max(1, config.featuredSlots.count) : Math.max(1, pool.length ? 5 : 1);

    const rng = mulberry32(hashString(clusterId) ^ seed);

    let chosen = [...pool];
    if (config.rotation.mode === 'manual' && config.rotation.strategy === 'weighted' && pool.length > 0) {
        const totalWeight = pool.reduce((sum, d) => sum + (config.weights[d.id] ?? 1), 0);
        const ordered: RotatorDeal[] = [];
        const remaining = [...pool];
        while (remaining.length > 0) {
            const roll = rng() * totalWeight;
            let acc = 0;
            let idx = 0;
            for (let i = 0; i < remaining.length; i++) {
                acc += config.weights[remaining[i].id] ?? 1;
                if (roll <= acc) { idx = i; break; }
            }
            ordered.push(remaining.splice(idx, 1)[0]);
            if (ordered.length >= slots) break;
        }
        chosen = ordered;
    } else {
        // Fisher–Yates shuffle for a fair "balanced" look.
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        chosen = pool.slice(0, slots);
    }

    return {
        clusterId,
        deals: chosen.map(d => ({
            id: d.id,
            name: d.name,
            businessName: d.businessName,
            mainImage: d.mainImage,
            isTrending: d.isTrending,
            category: d.category,
        })),
        simulated: true,
        seed,
    };
};

// -----------------------------------------------------------------------------
// Analytics (mock)
// -----------------------------------------------------------------------------

export const mockAnalytics = (clusterId: string, clusterName: string, qrScans: number): RotationAnalytics => {
    const rng = mulberry32(hashString(clusterId + '-analytics'));
    const catalogue = buildCatalogue(clusterId);
    const served = Math.max(qrScans, 1) * range(rng, 2, 4);
    const top = catalogue.deals
        .filter(d => d.status === 'active')
        .slice(0, 5)
        .map(d => ({
            dealId: d.id,
            name: d.name,
            businessName: d.businessName,
            impressions: Math.round((rng() * 500 + 400) * (1 + (qrScans % 7))),
        }))
        .sort((a, b) => b.impressions - a.impressions);
    return {
        clusterId,
        qrScans,
        dealsServed: served,
        dealViews: Math.round(served * 0.5),
        clicks: Math.round(served * 0.12),
        redemptions: Math.round(served * 0.018),
        topExposure: top,
        lastUpdated: iso(new Date()),
    };
};

// -----------------------------------------------------------------------------
// QR overrides (mock)
// -----------------------------------------------------------------------------

export const getMockQrRotation = (clusterId: string, qrId: string): QrRotationConfig => {
    const db = loadDb();
    const existing = db.qr[qrId];
    if (existing) return existing;
    const cfg: QrRotationConfig = {
        qrId,
        clusterId,
        inheritCluster: true,
        dealPool: { mode: 'all', ids: [] },
        rotation: { inherit: true, strategy: 'balanced' },
    };
    db.qr[qrId] = cfg;
    saveDb(db);
    return cfg;
};

export const saveMockQrRotation = (cfg: QrRotationConfig): QrRotationConfig => {
    const db = loadDb();
    db.qr[cfg.qrId] = cfg;
    saveDb(db);
    return cfg;
};

// -----------------------------------------------------------------------------
// Global defaults (mock)
// -----------------------------------------------------------------------------

export const getMockGlobalDefaults = (): GlobalRotationDefaults => {
    const db = loadDb();
    if (db.defaults) return db.defaults;
    const cfg: GlobalRotationDefaults = { ...DEFAULT_GLOBAL_ROTATION };
    db.defaults = cfg;
    saveDb(db);
    return cfg;
};

export const saveMockGlobalDefaults = (patch: Partial<GlobalRotationDefaults>): GlobalRotationDefaults => {
    const db = loadDb();
    db.defaults = { ...(db.defaults ?? DEFAULT_GLOBAL_ROTATION), ...patch, updatedAt: iso(new Date()) };
    saveDb(db);
    return db.defaults;
};

export const resetMockGlobalDefaults = (): GlobalRotationDefaults => {
    const db = loadDb();
    db.defaults = { ...DEFAULT_GLOBAL_ROTATION };
    saveDb(db);
    return db.defaults;
};