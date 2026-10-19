/**
 * Option sets for the Boost and Campaign wizards. Ids match the mobile
 * screens; labels are the defaults the app may show.
 */
export const BOOST_GOALS = [
  { id: 'claims', label: 'More Deal Claims & Sales' },
  { id: 'views', label: 'More Views & Local Visibility' },
  { id: 'profile', label: 'More Profile Visits & Followers' },
  { id: 'footfall', label: 'More Footfall & Store Visits' },
] as const;

export const PROMOTION_OBJECTIVES = [
  { id: 'customers', label: 'Get More Customers' },
  { id: 'deal', label: 'Promote a Deal' },
  { id: 'visibility', label: 'Increase Business Visibility' },
  { id: 'products', label: 'Promote Products' },
  { id: 'orders', label: 'Drive Orders' },
  { id: 'visits', label: 'Increase Visits' },
] as const;

export const AUDIENCE_SCOPES = [
  { id: 'nearby', label: 'Nearby Customers' },
  { id: 'districts', label: 'Selected Districts' },
  { id: 'clusters', label: 'Multi-Branch Clusters' },
] as const;

/**
 * Who a boost is shown to, on top of its geography. Both come from the
 * business's own data; targeting people by their claims at rival businesses
 * ("competitor deal claimers") is deliberately not offered.
 */
export const BOOST_AUDIENCE_TYPES = [
  { id: 'regulars', label: 'Past Customers & Regulars' },
  { id: 'walkins', label: 'New Walk-ins in 1km Radius' },
] as const;

/** "Walk-ins" are viewers within this distance of the branch. */
export const WALKIN_RADIUS_KM = 1;

export const PROMOTION_STRATEGIES = [
  { id: 'nearby', label: 'All Nearby Customers' },
  { id: 'segments', label: 'Specific Segments' },
] as const;

export const PROMOTION_COHORTS = [
  { id: 'vip', label: 'Frequent VIP Diners' },
  { id: 'regulars', label: 'Deal Regulars' },
  { id: 'new', label: 'New Patrons (Last 30 Days)' },
  { id: 'dormant', label: 'Dormant / At-Risk (>60 Days)' },
] as const;

export const RADIUS_OPTIONS_KM = [1, 3, 5, 10] as const;

export const PLACEMENTS = [
  { id: 'feed', label: 'Deal Discovery Feed' },
  { id: 'home', label: 'Consumer Home Spotlight' },
  { id: 'push', label: 'Proximity Push Alerts' },
  { id: 'search', label: 'Search & Category Promoted' },
] as const;

export const DAYPART_WINDOWS = [
  { id: 'lunch', label: 'Lunch Rush', start: '11:30', end: '15:30' },
  { id: 'dinner', label: 'Dinner Rush', start: '18:30', end: '22:00' },
  { id: 'late', label: 'Late Night', start: '22:00', end: '01:00' },
] as const;

export const DURATION_OPTIONS_DAYS = [3, 5, 7, 14, 30] as const;

export const BOOST_BUDGET_TIERS = [
  { id: '10', amount: 10_000, label: 'Starter' },
  { id: '20', amount: 20_000, label: 'Best Value' },
  { id: '40', amount: 40_000, label: 'Growth' },
] as const;

export const PROMOTION_BUDGET_TIERS = [
  { id: 'starter', amount: 15_000, label: 'Starter Booster' },
  { id: 'growth', amount: 35_000, label: 'Growth Accelerator' },
  { id: 'surge', amount: 70_000, label: 'Market Leader Surge' },
] as const;

/** Smallest total budget a campaign can launch with (₦). */
export const MIN_CAMPAIGN_BUDGET = 2_000;

/** The longest a run may last, including budget added while it is live. */
export const MAX_RUN_DAYS = 90;

/**
 * Forecast model, calibrated to the wizard's published tiers (e.g. ₦10,000
 * → ~4,000–6,500 people, ~40–60 claims). These are estimates, not promises:
 * people reached per naira, a claim rate band, and a cap on how many people
 * live within each radius.
 */
export const FORECAST = {
  reachPerNairaMin: 0.42,
  reachPerNairaMax: 0.66,
  claimRateMin: 0.0075,
  claimRateMax: 0.0092,
  populationByRadiusKm: {
    1: 8_000,
    3: 40_000,
    5: 90_000,
    10: 250_000,
  } as Record<number, number>,
} as const;
