/**
 * The referral milestone ladder: a business climbs it by referring other
 * businesses to VemTap that go on to pass verification. Thresholds count
 * verified referrals only.
 */
export interface NetworkTier {
  id: string;
  name: string;
  threshold: number;
  perks: string[];
}

export const NETWORK_TIERS: readonly NetworkTier[] = [
  {
    id: 'starter',
    name: 'Network Starter',
    threshold: 3,
    perks: [
      'Network recognition',
      'Eligible for selected network opportunities',
    ],
  },
  {
    id: 'partner',
    name: 'Network Partner',
    threshold: 5,
    perks: [
      'Network Partner status',
      'Partner badge on merchant profiles',
      'Eligible for selected promotional opportunities',
    ],
  },
  {
    id: 'community',
    name: 'Community Network Partner',
    threshold: 10,
    perks: [
      'Community recognition',
      'Additional network opportunities',
      'Eligible for selected local campaigns',
    ],
  },
  {
    id: 'builder',
    name: 'Local Network Builder',
    threshold: 25,
    perks: [
      'Local Network Builder recognition',
      'District-wide campaign eligibility',
    ],
  },
];

export type TierState = 'unlocked' | 'active' | 'locked';

/**
 * Each tier's state for a verified count: every reached tier is unlocked
 * except the highest, which is the active one; the rest are locked, with
 * progress toward each.
 */
export function tierLadder(verified: number) {
  const reached = NETWORK_TIERS.filter((tier) => verified >= tier.threshold);
  const current = reached[reached.length - 1] ?? null;
  const next = NETWORK_TIERS.find((tier) => verified < tier.threshold) ?? null;
  return {
    tiers: NETWORK_TIERS.map((tier) => ({
      ...tier,
      state:
        verified >= tier.threshold
          ? tier.id === current?.id
            ? 'active'
            : 'unlocked'
          : 'locked',
      progress: Math.min(1, verified / tier.threshold),
      remaining: Math.max(0, tier.threshold - verified),
    })),
    current: current ? { id: current.id, name: current.name } : null,
    next: next
      ? {
          id: next.id,
          name: next.name,
          threshold: next.threshold,
          remaining: next.threshold - verified,
          progress: Math.min(1, verified / next.threshold),
        }
      : null,
  };
}
