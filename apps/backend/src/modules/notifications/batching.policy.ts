/**
 * Which notifications batch, and how.
 *
 * Everything here is deliberately narrow. A burst of the same event (five
 * ratings during a lunch rush) is one thing to five recipients, but a
 * transactional event (an order was placed) is five different facts, and
 * merging them would hide three of them behind a count. So the default is
 * not to batch, and a type opts in explicitly.
 *
 * The window is measured from the batch's *first* event, not reset by each
 * new one. A sliding window never expires under steady traffic, so a busy
 * account's ratings would stay in one row forever.
 */

export interface BatchPolicy {
  /** Milliseconds an open batch accepts new events before it closes. */
  windowMs: number;
  /**
   * Separates events that must not merge even within the same type — e.g.
   * messages from two different threads. Returns the entity discriminator
   * to append to the batch key, or null when none applies.
   */
  entityOf?: (metadata?: Record<string, any> | null) => string | null;
  /**
   * Whether the first event of a batch may push immediately. Order-style
   * notices want one push per event; rating bursts want a single summary
   * when the window closes.
   */
  pushImmediately: boolean;
}

/**
 * Five minutes, the common default for grouping social activity: long
 * enough to swallow a real burst, short enough that a lone notification
 * does not feel stale by the time it appears.
 */
export const DEFAULT_BATCH_WINDOW_MS = 5 * 60 * 1000;

/**
 * Only ratings batch.
 *
 * Everything else is either transactional (orders, order status, messages,
 * subscription reminders — the recipient needs each one) or already
 * throttled at the source (deal velocity carries its own 8-hour cooldown,
 * so at most one row per recipient can land in any window and a batcher
 * would never fire; shift-closed notices carry a per-event till total that
 * cannot represent a group, so merging them would misreport the figure).
 */
const BATCHABLE: Record<string, BatchPolicy> = {
  new_rating: {
    windowMs: DEFAULT_BATCH_WINDOW_MS,
    pushImmediately: false,
  },
  product_comment: {
    windowMs: DEFAULT_BATCH_WINDOW_MS,
    pushImmediately: false,
  },
};

export function getBatchPolicy(
  eventType: string | null | undefined,
): BatchPolicy | null {
  if (!eventType) return null;
  return BATCHABLE[eventType] ?? null;
}

export function isBatchable(eventType: string | null | undefined): boolean {
  return getBatchPolicy(eventType) !== null;
}

/**
 * Builds the batching identity: one recipient, one event type, plus an
 * optional entity so same-type events for different subjects stay apart.
 */
export function buildBatchKey(
  userId: string,
  eventType: string,
  metadata?: Record<string, any> | null,
): string {
  const policy = BATCHABLE[eventType];
  const entity = policy?.entityOf?.(metadata);
  return entity ? `${userId}:${eventType}:${entity}` : `${userId}:${eventType}`;
}

/** Stable job id for the closer, so re-queueing the same batch is a no-op. */
export function closeJobId(batchKey: string): string {
  return `notif-batch-close:${batchKey}`;
}
