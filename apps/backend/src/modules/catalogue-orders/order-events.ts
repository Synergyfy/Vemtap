import { CatalogueOrderStatus } from './entities/catalogue-order.entity';

/**
 * In-process events for order lifecycle changes. Emitted wherever an order is
 * created or changes status, so live views (kitchen stream, guest tracking)
 * hear about every change whichever endpoint made it.
 */
export const ORDER_EVENTS = {
  CREATED: 'catalogue-order.created',
  STATUS_CHANGED: 'catalogue-order.status-changed',
} as const;

export interface OrderLifecycleEvent {
  orderId: string;
  businessId: string;
  branchId: string;
  status: CatalogueOrderStatus;
  trackingToken: string | null;
  tableNumber: string | null;
  at: string;
}

/** Stamp `status` into an order's timeline without overwriting an earlier time. */
export function stampStatus(
  timeline: Partial<Record<CatalogueOrderStatus, string>> | null | undefined,
  status: CatalogueOrderStatus,
  at: Date = new Date(),
): Partial<Record<CatalogueOrderStatus, string>> {
  const next = { ...(timeline ?? {}) };
  if (!next[status]) next[status] = at.toISOString();
  return next;
}
