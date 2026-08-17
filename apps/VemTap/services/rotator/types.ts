// =============================================================================
// SMART DEAL ROTATOR — FRONTEND CONTRACT
// =============================================================================
// The backend team implements the real endpoints. This file only defines the
// UI-facing contract the frontend renders. No backend code lives here.
//
// Intended backend surface (filled in by the backend team later):
//   GET    /admin/clusters/:id/rotation                -> RotationConfig
//   PATCH  /admin/clusters/:id/rotation                (partial config)
//   POST   /admin/clusters/:id/rotation/reset          -> reset to automatic
//   GET    /admin/clusters/:id/rotation/deals      -> RotatorDeal[]
//   GET    /admin/clusters/:id/rotation/deals/:dealId/eligibility -> DealEligibility
//   GET    /admin/clusters/:id/rotation/analytics      -> RotationAnalytics
//   GET    /admin/clusters/:id/rotation/preview        -> RotationPreview
//   GET    /admin/rotator/defaults                     -> GlobalRotationDefaults
//   PATCH  /admin/rotator/defaults                     (partial defaults)
//   POST   /admin/rotator/defaults/reset               -> reset defaults to built-in
//   GET    /clusters/qr/:qrId/rotation                 -> QrRotationConfig
//   PATCH  /clusters/qr/:qrId/rotation
// -----------------------------------------------------------------------------

export type AutoMode = 'automatic' | 'manual';

export type RotationStrategy = 'balanced' | 'weighted' | 'scheduled' | 'smart';

export type RotationStatus = 'active' | 'paused';

export type DealStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

/** A single deal the rotator can decide to show (or hide) for a cluster. */
export interface RotatorDeal {
    id: string;
    name: string;
    description?: string;
    mainImage?: string | null;
    isTrending?: boolean;
    businessId: string;
    businessName: string;
    businessSlug?: string;
    branchId?: string;
    categoryId?: string;
    category: string;
    status: DealStatus;
    startDate: string | null;
    endDate: string | null;
}

/** Per-deal manual schedule window. */
export interface DealSchedule {
    id: string;
    dealId: string;
    dealName?: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

/** What the admin hand-picks when a single QR no longer inherits the cluster. */
export interface QrRotationConfig {
    qrId: string;
    clusterId: string;
    /** 'Inherit Cluster Settings' is the default and the only thing an admin
     *  should ever need for 95% of QRs. */
    inheritCluster: boolean;
    /** Deal pool shown on this QR. */
    dealPool: { mode: 'all' | 'custom'; ids: string[] };
    /** Rotation behaviour. `inherit` uses the cluster strategy. */
    rotation: { inherit: boolean; strategy: RotationStrategy };
}

/** The core per-cluster rotation configuration. Automatic by default. */
export interface RotationConfig {
    clusterId: string;
    status: RotationStatus;
    eligibility: { mode: AutoMode; included: string[]; excluded: string[] };
    rotation: { mode: AutoMode; strategy: RotationStrategy };
    /** DealId -> weight. Only used when rotation.mode === 'manual' and strategy is weighted. */
    weights: Record<string, number>;
    schedules: DealSchedule[];
    featuredSlots: { mode: AutoMode; count: number };
    frequency: { mode: AutoMode; maxViewsPerCustomerPerDay: number };
    /**
     * Length of a rotation window in seconds (default 60). Internally controlled
     * by the platform team — never exposed to businesses. Everyone scanning
     * within the same window receives the exact same cached deal arrangement.
     */
    rotationWindowSeconds: number;
    updatedAt: string | null;
}

/** The site-wide defaults every cluster inherits until it is overridden.
 *  Sections not listed here (weights, schedules) are per-cluster only. */
export interface GlobalRotationDefaults {
    eligibilityMode: AutoMode;
    rotationMode: AutoMode;
    rotationStrategy: RotationStrategy;
    featuredSlotsMode: AutoMode;
    featuredSlotsCount: number;
    frequencyMode: AutoMode;
    frequencyMaxViewsPerCustomerPerDay: number;
    frequencyWindowHours: number;
    updatedAt: string | null;
}

export interface EligibilityMatch {
    label: string;
    passed: boolean;
    detail?: string;
}

export interface DealEligibility {
    dealId: string;
    eligible: boolean;
    reason: string;
    checks: EligibilityMatch[];
}

export interface RotationAnalytics {
    clusterId: string;
    qrScans: number;
    dealsServed: number;
    dealViews: number;
    clicks: number;
    redemptions: number;
    topExposure: Array<{
        dealId: string;
        name: string;
        businessName: string;
        impressions: number;
    }>;
    lastUpdated: string;
}

export interface RotationPreviewDeal {
    id: string;
    name: string;
    businessName: string;
    mainImage?: string | null;
    isTrending?: boolean;
    category?: string;
}

export interface RotationPreview {
    clusterId: string;
    deals: RotationPreviewDeal[];
    simulated: boolean;
    seed: number;
}

// -----------------------------------------------------------------------------
// Backend-aligned contracts (implemented by /admin/clusters/:id/rotator)
// The real backend returns these raw shapes. The frontend maps them into the
// richer model above, and translates the richer mutations back into the flat
// backend payloads before calling the endpoints.
// -----------------------------------------------------------------------------

/** Single rotation window result from the engine (admin preview + live feed). */
export interface RotationResultDto {
    clusterId: string;
    windowId: number;
    windowStart: string;
    windowEnd: string;
    slotCount: number;
    featured: string[];
}

/** Raw backend config (global and merged-per-cluster). */
export interface BackendRotatorConfig {
    rotationMode: 'automatic' | 'manual';
    distribution: RotationStrategy;
    featuredSlotsMode: 'automatic' | 'manual';
    featuredSlotCount: number | null;
    windowSeconds: number;
    frequencyWindowHours: number;
    isOverridden?: boolean;
    updatedAt?: string;
}

/** Raw backend eligibility summary. */
export interface BackendEligibilitySummary {
    automatic: boolean;
    manual: boolean;
    totalEligible: number;
    included: string[];
    excluded: string[];
    mode: 'automatic' | 'manual';
}

/** Raw backend "why is this deal showing" explanation. */
export interface BackendWhyDto {
    offerId: string;
    eligible: boolean;
    businessActive: boolean;
    dealActive: boolean;
    clusterMatch: boolean;
    notExpired: boolean;
    schedule: boolean;
    frequencyEligible: boolean;
    included: boolean;
    manualIncluded: boolean | null;
    manualExcluded: boolean;
    deliveryWeight: number;
    rotation: string;
    mode: string;
    status: 'Eligible' | 'Excluded' | 'Expired' | 'Paused' | 'Scheduled-out';
    reasons: string[];
}

/** Raw backend analytics summary. */
export interface BackendAnalyticsSummary {
    impressions: number;
    uniqueReach: number;
    clicks: number;
    ctr?: number;
    topExposure: Array<{
        offerId: string;
        name: string;
        businessName: string;
        impressions: number;
    }>;
}

export type RotationOverrideKey =
    | 'eligibility'
    | 'rotation'
    | 'featuredSlots'
    | 'scheduling'
    | 'frequency';

export const OVERRIDE_LABELS: Record<RotationOverrideKey, string> = {
    eligibility: 'Eligible Deals',
    rotation: 'Rotation',
    featuredSlots: 'Featured Slots',
    scheduling: 'Scheduling',
    frequency: 'Frequency',
};

export const STRATEGY_LABELS: Record<RotationStrategy, string> = {
    balanced: 'Balanced',
    weighted: 'Weighted',
    scheduled: 'Scheduled',
    smart: 'Smart',
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
    active: 'Active',
    scheduled: 'Scheduled',
    expired: 'Expired',
    inactive: 'Inactive',
};

/** Vemtap's built-in "Automatic first" defaults — the sane fallback for every
 *  cluster and the initial value of the global defaults store. */
export const DEFAULT_GLOBAL_ROTATION: GlobalRotationDefaults = {
    eligibilityMode: 'automatic',
    rotationMode: 'automatic',
    rotationStrategy: 'balanced',
    featuredSlotsMode: 'automatic',
    featuredSlotsCount: 5,
    frequencyMode: 'automatic',
    frequencyMaxViewsPerCustomerPerDay: 3,
    frequencyWindowHours: 24,
    updatedAt: null,
};

/** Returns true when a cluster section differs from the given global default —
 *  i.e. the cluster is "overridden" for that control. */
export function isSectionOverridden(config: RotationConfig, section: RotationOverrideKey, defaults?: GlobalRotationDefaults | null): boolean {
    if (!defaults) return false;
    switch (section) {
        case 'eligibility':
            return config.eligibility.mode !== defaults.eligibilityMode
                || (config.eligibility.mode === 'manual' && config.eligibility.included.length === 0 && config.eligibility.excluded.length === 0);
        case 'rotation':
            return config.rotation.mode !== defaults.rotationMode
                || (config.rotation.mode === 'manual' && config.rotation.strategy !== defaults.rotationStrategy);
        case 'featuredSlots':
            return config.featuredSlots.mode !== defaults.featuredSlotsMode
                || (config.featuredSlots.mode === 'manual' && config.featuredSlots.count !== defaults.featuredSlotsCount);
        case 'frequency':
            return config.frequency.mode !== defaults.frequencyMode
                || (config.frequency.mode === 'manual' && config.frequency.maxViewsPerCustomerPerDay !== defaults.frequencyMaxViewsPerCustomerPerDay);
        case 'scheduling':
            return config.schedules.length > 0;
        default:
            return false;
    }
}

/** Default rotation window length in seconds — platform-controlled, not exposed
 *  to businesses. Every cluster's config carries this unless the platform team
 *  overrides it. */
export const DEFAULT_ROTATION_WINDOW_SECONDS = 60;

/** The bounds + label of the rotation window that contains the given instant.
 *  Everyone scanning inside `start`..`end` sees the same cached arrangement. */
export interface RotationWindow {
    /** Index (0-based) of the window in the day — used as a stable cache key. */
    index: number;
    start: Date;
    end: Date;
    /** e.g. "10:31:00–10:31:59" */
    label: string;
    /** Seconds left before the next window begins. */
    remainingSeconds: number;
    /** True when the instant is exactly the first moment of its own window. */
    isFresh: boolean;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtTime = (d: Date) =>
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

/**
 * Returns the rotation window enclosing `instant` for a config's window length.
 * Window boundaries are aligned to whole multiples of `windowSeconds` from the
 * epoch (00:00:00 local), matching the backend's `rotation:{cluster}:{windowId}`
 * cache-key model.
 */
export function windowForInstant(instant: Date, windowSeconds: number): RotationWindow {
    const ms = instant.getTime();
    const step = Math.max(1, windowSeconds) * 1000;
    const startMs = Math.floor(ms / step) * step;
    const start = new Date(startMs);
    const end = new Date(startMs + step - 1);
    return {
        index: Math.floor(startMs / step),
        start,
        end,
        label: `${fmtTime(start)}–${fmtTime(end)}`,
        remainingSeconds: Math.max(0, Math.ceil((end.getTime() + 1 - ms) / 1000)),
        isFresh: ms <= startMs + 1000,
    };
}