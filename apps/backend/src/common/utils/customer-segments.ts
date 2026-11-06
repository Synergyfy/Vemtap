/**
 * Thresholds that place a business's customer in a segment. POS customer
 * lookup and business analytics read the same values so a "VIP" on the till
 * is a "VIP" in the analytics.
 */
export const VIP_MIN_VISITS = 10;
export const VIP_MIN_SPEND = 100_000;
export const NEW_CUSTOMER_DAYS = 30;
export const LAPSED_CUSTOMER_DAYS = 60;
/** No touch for this long: dormant, the churn bucket of the analytics. */
export const DORMANT_CUSTOMER_DAYS = 90;
