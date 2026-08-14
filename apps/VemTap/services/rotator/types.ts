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
//   GET    /admin/clusters/:id/rotation/deals          -> RotatorDeal[]
//   GET    /admin/clusters/:id/rotation/deals/:dealId/eligibility -> DealEligibility
//   GET    /admin/clusters/:id/rotation/analytics      -> RotationAnalytics
//   GET    /admin/clusters/:id/rotation/preview        -> RotationPreview
//   GET    /clusters/qr/:qrId/rotation                 -> QrRotationConfig
//   PATCH  /clusters/qr/:qrId/rotation
// -----------------------------------------------------------------------------

export type AutoMode = 'automatic' | 'manual';

export type RotationStrategy = 'balanced' | 'weighted' | 'scheduled';

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
    updatedAt: string;
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
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
    active: 'Active',
    scheduled: 'Scheduled',
    expired: 'Expired',
    inactive: 'Inactive',
};