import type { RotatorEventType } from './entities/rotator-impression.entity';

export const ROTATOR_REFRESH_QUEUE = 'rotator-refresh';

export const ROTATOR_SLOT_MAP = [
  { minDeals: 1, slots: 2 },
  { minDeals: 3, slots: 3 },
  { minDeals: 8, slots: 3 },
  { minDeals: 15, slots: 4 },
  { minDeals: 40, slots: 5 },
  { minDeals: 100, slots: 6 },
] as const;

export function featuredSlotsForDealCount(
  eligibleCount: number,
  manual?: number | null,
): number {
  if (manual != null && manual > 0) return manual;
  if (eligibleCount <= 0) return 0;
  let slots: number = ROTATOR_SLOT_MAP[0].slots;
  for (const row of ROTATOR_SLOT_MAP) {
    if (eligibleCount >= row.minDeals) slots = row.slots;
  }
  return slots;
}

export function rotationWindowId(now: number, windowSeconds: number): number {
  return Math.floor(now / (windowSeconds * 1000));
}

export function rotationWindowStart(
  windowId: number,
  windowSeconds: number,
): number {
  return windowId * windowSeconds * 1000;
}

export function rotationWindowEnd(
  windowId: number,
  windowSeconds: number,
): number {
  return rotationWindowStart(windowId, windowSeconds) + windowSeconds * 1000;
}

export interface RotatorImpressionJobData {
  clusterId: string;
  offerIds: string[];
  windowId: number;
  customerId?: string | null;
  sessionToken?: string | null;
}

export interface RotatorViewClickJobData {
  eventType: RotatorEventType;
  clusterId: string;
  offerId: string;
  windowId: number;
  customerId?: string | null;
  sessionToken?: string | null;
}
