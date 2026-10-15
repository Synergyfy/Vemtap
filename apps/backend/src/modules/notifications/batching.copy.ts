/**
 * Aggregate copy for a collapsed batch.
 *
 * The row's `title`/`message` hold the *first* event's prose, which is right
 * for a single event and wrong for a group — "Jane left a 5-star rating"
 * next to a count of 4 is incoherent. The read path substitutes these when
 * `groupCount > 1`.
 *
 * `stat` and `footnote` are dropped rather than merged: they are per-event
 * figures (a rating's star value, its author), so carrying the first one
 * forward would describe one member as if it were the whole group.
 */

const ACTORS_NAMED_MAX = 2;

/**
 * "Jane and Amara", "Jane, Amara and 3 others", or "" when nothing is known.
 *
 * `totalCount` is the real number of events, which exceeds the stored names
 * once a row keeps only the first few — so "others" must be computed from it,
 * not from how many names happen to be stored, or the sentence silently
 * undercounts everyone past the storage cap.
 */
function formatActors(names: string[], totalCount: number): string {
  const named = names.filter(Boolean);
  if (named.length === 0) return '';

  const shown = named.slice(0, ACTORS_NAMED_MAX);
  const unnamed = Math.max(0, totalCount - shown.length);
  if (unnamed === 0) return shown.join(' and ');
  return `${shown.join(', ')} and ${unnamed} ${unnamed === 1 ? 'other' : 'others'}`;
}

export interface AggregateCopy {
  title: string;
  message: string;
}
/**
 * Renders "Jane and 3 others rated your business" style copy from the stored
 * actor names and the group count. Falls back to a count-only sentence when
 * no names were captured, so an aggregate is never rendered as a bare number.
 *
 * Only ever called with `groupCount > 1`, so the singular branch is for
 * safety rather than an expected case.
 */
export function buildAggregateCopy(
  eventType: string,
  actors: unknown[],
  groupCount: number,
): AggregateCopy | null {
  const names = actors
    .map(actor =>
      typeof actor === 'string'
        ? actor
        : actor && typeof actor === 'object' && 'name' in actor
          ? String((actor as { name?: unknown }).name ?? '')
          : '',
    )
    .filter((name): name is string => name.length > 0);

  const who = formatActors(names, groupCount);

  switch (eventType) {
    case 'new_rating': {
      if (groupCount <= 1) return null;
      if (who) {
        return {
          title: 'New ratings',
          message: `${who} left ${groupCount} ratings on your business`,
        };
      }
      return {
        title: 'New ratings',
        message: `${groupCount} new ratings on your business`,
      };
    }
    default:
      return null;
  }
}
