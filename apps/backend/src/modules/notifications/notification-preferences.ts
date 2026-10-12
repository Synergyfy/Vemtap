/**
 * The stored preference keys, in the order they are consulted.
 *
 * `category` is the sender's own signal about what kind of notification this
 * is; `type` is a coarser fallback. Matching is case-insensitive, because a
 * caller naming `type: 'ORDER_STATUS_UPDATE'` should be understood as
 * `orderUpdates` rather than silently bypassing the preference check — which
 * is exactly how it behaved before `category` existed.
 */
export const PREFERENCE_KEYS = [
  'push',
  'marketing',
  'orderUpdates',
  'loyalty',
  'support',
  'rewardAlerts',
  'activityDigest',
  'sms',
  'email',
  'smsSecurity',
] as const;

export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

/** True when this notification must not be pushed to this user. */
export function blockedByPreference(
  preferences: Record<string, boolean> | null | undefined,
  data: Record<string, any>,
): boolean {
  if (!preferences) return false;
  if (preferences.push === false) return true;

  const key = data?.category ?? data?.type;
  if (typeof key !== 'string' || !key.length) return false;

  // A caller may name a key that is not a preference key at all. Only match
  // keys the preferences actually cover, so anything unrecognised is sent.
  const matched = PREFERENCE_KEYS.find(
    (k) => k.toLowerCase() === key.toLowerCase(),
  );
  if (!matched) return false;

  return preferences[matched] === false;
}
