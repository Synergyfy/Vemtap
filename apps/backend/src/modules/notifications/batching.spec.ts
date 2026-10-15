import { buildAggregateCopy } from './batching.copy';
import {
  buildBatchKey,
  closeJobId,
  DEFAULT_BATCH_WINDOW_MS,
  getBatchPolicy,
  isBatchable,
} from './batching.policy';

describe('batching policy', () => {
  it('batches ratings and nothing else', () => {
    expect(isBatchable('new_rating')).toBe(true);
    expect(isBatchable('new_order')).toBe(false);
    expect(isBatchable('new_pos_order')).toBe(false);
    expect(isBatchable('new_message')).toBe(false);
    expect(isBatchable('order_status')).toBe(false);
    expect(isBatchable('subscription_reminder')).toBe(false);
    // Already throttled at the source by an 8h cooldown, so a batcher would
    // never observe two in one window.
    expect(isBatchable('deal_spike')).toBe(false);
    // Carries a per-event till total that cannot represent a group.
    expect(isBatchable('shift_closed')).toBe(false);
    expect(isBatchable('announcement')).toBe(false);
  });

  it('never batches a row with no event type, so legacy rows pass through', () => {
    expect(isBatchable(null)).toBe(false);
    expect(isBatchable(undefined)).toBe(false);
  });

  it('keys a batch per recipient and event type', () => {
    expect(buildBatchKey('user-1', 'new_rating')).toBe('user-1:new_rating');
  });

  it('splits the key on an entity discriminator when the policy has one', () => {
    expect(
      buildBatchKey('user-1', 'new_message', { threadId: 'thread-9' }),
    ).toBe('user-1:new_message');
  });

  it('uses a five-minute window', () => {
    expect(DEFAULT_BATCH_WINDOW_MS).toBe(5 * 60 * 1000);
    expect(getBatchPolicy('new_rating')?.windowMs).toBe(5 * 60 * 1000);
  });

  it('holds the push on ratings so a burst sends one summary, not N pushes', () => {
    expect(getBatchPolicy('new_rating')?.pushImmediately).toBe(false);
  });

  it('derives a stable close job id from the batch key', () => {
    expect(closeJobId('user-1:new_rating')).toBe(
      'notif-batch-close:user-1:new_rating',
    );
  });
});

describe('aggregate copy', () => {
  it('names two actors and counts the rest against the true total', () => {
    const copy = buildAggregateCopy(
      'new_rating',
      [{ name: 'Jane' }, { name: 'Amara' }, { name: 'Chidi' }],
      3,
    );
    expect(copy).toEqual({
      title: 'New ratings',
      message: 'Jane, Amara and 1 other left 3 ratings on your business',
    });
  });

  it('names both actors when only two contributed', () => {
    const copy = buildAggregateCopy(
      'new_rating',
      [{ name: 'Jane' }, { name: 'Amara' }],
      2,
    );
    expect(copy?.message).toBe('Jane and Amara left 2 ratings on your business');
  });

  it('collapses long name lists into "N others"', () => {
    // Two names are spelled out; the rest count. With four stored names that
    // reads "Jane, Amara and 2 others", which names all four.
    const copy = buildAggregateCopy(
      'new_rating',
      [{ name: 'Jane' }, { name: 'Amara' }, { name: 'Chidi' }, { name: 'Bola' }],
      4,
    );
    expect(copy?.message).toBe('Jane, Amara and 2 others left 4 ratings on your business');
  });

  it('counts events whose names were not stored', () => {
    // The row only keeps five actor names, so a group larger than that has
    // real contributors beyond the stored ones — "others" must count from the
    // true total, not from the stored names, or the sentence undercounts.
    const actors = Array.from({ length: 5 }, (_, i) => ({ name: `Person${i}` }));
    const copy = buildAggregateCopy('new_rating', actors, 12);
    expect(copy?.message).toBe(
      'Person0, Person1 and 10 others left 12 ratings on your business',
    );
  });

  it('falls back to a count when no names were captured', () => {
    const copy = buildAggregateCopy('new_rating', [], 4);
    expect(copy).toEqual({
      title: 'New ratings',
      message: '4 new ratings on your business',
    });
  });

  it('tolerates actor entries that are not objects', () => {
    // Only one of the three entries yields a name, so the other two events
    // count as unnamed rather than being silently dropped from the sentence.
    const copy = buildAggregateCopy('new_rating', [null, 'Jane', 7], 3);
    expect(copy?.message).toBe('Jane and 2 others left 3 ratings on your business');
  });

  it('returns null for a single event, so the stored prose is kept', () => {
    expect(buildAggregateCopy('new_rating', [{ name: 'Jane' }], 1)).toBeNull();
  });

  it('returns null for an event type with no template', () => {
    expect(buildAggregateCopy('new_order', [{ name: 'Jane' }], 3)).toBeNull();
  });
});
