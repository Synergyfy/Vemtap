/**
 * Renewal reminder configuration for the cluster deals feed.
 *
 * A business's offers only surface in a cluster when it has a valid
 * subscription whose plan includes the Discovery Network (see
 * ClustersService.buildOfferQuery). These constants drive the periodic job
 * that nudges owners before that gate drops them out, and right after it does.
 */

/** Escalation stages in days-before-expiry. A business is reminded once per
 *  stage as its endDate crosses each threshold. */
export const SUBSCRIPTION_REMINDER_STAGES = [14, 7, 3] as const;

/** Sentinel stage used to dedupe the post-expiry ("lapsed") reminder. */
export const SUBSCRIPTION_REMINDER_LAPSED_STAGE = 0;

/** How long after endDate a lapsed business may still receive the expired
 *  reminder before we stop nagging. */
export const SUBSCRIPTION_REMINDER_LAPSED_DAYS = 7;

/** Engagement window (days) for the "potential customers" stat — unique people
 *  who browsed a cluster's deals feed within this period. */
export const SUBSCRIPTION_REMINDER_CUSTOMER_LOOKBACK_DAYS = 30;

/** Daily run time (08:00 server-local). */
export const SUBSCRIPTION_REMINDER_CRON = '0 8 * * *';

/** Deep link used for both the in-app notification actionUrl and the push
 *  notification tap-through. */
export const SUBSCRIPTION_RENEWAL_URL = '/dashboard/settings/subscription';
