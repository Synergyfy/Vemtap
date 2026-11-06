import {
  OfferClaimLimitPeriod,
  type OfferRedemptionWindow,
} from '../entities/catalogue-offer.entity';

/** Deals are run on Nigerian local time; WAT has no daylight saving. */
const LAGOS_OFFSET_MINUTES = 60;

/** Wall-clock parts of `at` in Africa/Lagos. */
function lagosParts(at: Date): {
  weekday: number;
  minutes: number;
  dayStartUtc: Date;
} {
  const local = new Date(at.getTime() + LAGOS_OFFSET_MINUTES * 60_000);
  const weekday = local.getUTCDay();
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const dayStartUtc = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
      LAGOS_OFFSET_MINUTES * 60_000,
  );
  return { weekday, minutes, dayStartUtc };
}

/**
 * Start of the window `maxClaimsPerCustomer` is counted over, or null for a
 * lifetime limit. Day/week/month follow the Lagos calendar; weeks start on
 * Monday.
 */
export function claimLimitWindowStart(
  period: OfferClaimLimitPeriod | null | undefined,
  now: Date = new Date(),
): Date | null {
  if (!period || period === OfferClaimLimitPeriod.LIFETIME) return null;
  const { weekday, dayStartUtc } = lagosParts(now);
  if (period === OfferClaimLimitPeriod.DAY) return dayStartUtc;
  if (period === OfferClaimLimitPeriod.WEEK) {
    const sinceMonday = (weekday + 6) % 7;
    return new Date(dayStartUtc.getTime() - sinceMonday * 24 * 60 * 60_000);
  }
  const local = new Date(now.getTime() + LAGOS_OFFSET_MINUTES * 60_000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) -
      LAGOS_OFFSET_MINUTES * 60_000,
  );
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Whether `at` falls inside any redemption window. No windows means the deal
 * can be redeemed at any time. A window whose end is before its start runs
 * past midnight (e.g. 22:00–02:00).
 */
export function isWithinRedemptionWindows(
  windows: OfferRedemptionWindow[] | null | undefined,
  at: Date = new Date(),
): boolean {
  if (!windows?.length) return true;
  const { weekday, minutes } = lagosParts(at);
  return windows.some((window) => {
    const start = toMinutes(window.start);
    const end = toMinutes(window.end);
    const days = window.weekdays ?? [];
    const dayMatches = (day: number) => days.length === 0 || days.includes(day);
    if (start <= end) {
      return dayMatches(weekday) && minutes >= start && minutes <= end;
    }
    // Overnight: the evening part belongs to today, the early-morning part to
    // the window that opened yesterday.
    return (
      (dayMatches(weekday) && minutes >= start) ||
      (dayMatches((weekday + 6) % 7) && minutes <= end)
    );
  });
}

/** Human-readable windows for an error message, e.g. "Mon–Fri 12:00–16:30". */
export function describeRedemptionWindows(
  windows: OfferRedemptionWindow[],
): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return windows
    .map((window) => {
      const days = window.weekdays?.length
        ? window.weekdays.map((day) => names[day]).join(', ')
        : 'Daily';
      return `${days} ${window.start}–${window.end}`;
    })
    .join('; ');
}
