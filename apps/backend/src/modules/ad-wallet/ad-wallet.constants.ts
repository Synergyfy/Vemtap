/**
 * Top-up bundles shown on the wallet screen. Bonus credit is promotional
 * money added on top of what was paid; change these to change the offer.
 */
export const AD_WALLET_PREPACKS = [
  {
    id: '10k',
    amount: 10_000,
    bonus: 500,
    label: '₦10,000 Top-Up',
    tier: null,
  },
  {
    id: '25k',
    amount: 25_000,
    bonus: 2_000,
    label: '₦25,000 Top-Up',
    tier: 'Popular',
  },
  {
    id: '50k',
    amount: 50_000,
    bonus: 5_000,
    label: '₦50,000 Top-Up',
    tier: 'Growth Tier',
  },
] as const;

/** Smallest custom top-up, in naira. */
export const AD_WALLET_MIN_TOPUP = 2_000;
/** Largest single top-up, in naira. */
export const AD_WALLET_MAX_TOPUP = 5_000_000;
