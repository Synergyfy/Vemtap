'use client';

import { queryClient } from './queryClient';
import { clearOfflineCache } from './offline/db';

// Persist keys for per-business client stores that must not leak between accounts.
const BUSINESS_STORAGE_KEYS = [
  'vemtap-pos-storage-v2',
  'vemtap-pos-settings-storage',
  'vemtap-catalogue-storage',
  'vemtap-inventory-storage-v2',
  'vemtap-activation-storage',
  'business-storage',
  'business-forms-storage-v1',
  'chat-history',
  'vemtap-chat-storage',
  'qr-thrive-storage',
  'vemtap-qrthrive-ui-storage',
  'subscription-storage',
  'vemtap-pos-loyalty-storage',
];

async function resetClientStores() {
  // Dynamic imports avoid a circular dependency with useAuthStore.
  const resets: (() => void)[] = [];
  try {
    const { usePosStore } = await import('@/store/usePosStore');
    resets.push(() => usePosStore.getState().clearCart());
  } catch {}
  try {
    const { usePosSettingsStore } = await import('@/store/usePosSettingsStore');
    resets.push(() => usePosSettingsStore.getState().resetStore());
  } catch {}
  try {
    const { useCatalogueStore } = await import('@/store/useCatalogueStore');
    resets.push(() => useCatalogueStore.getState().resetStore());
  } catch {}
  try {
    const { useBusinessStore } = await import('@/store/useBusinessStore');
    resets.push(() => useBusinessStore.getState().setBranches([]));
  } catch {}
  try {
    const { useInventoryStore } = await import('@/store/useInventoryStore');
    resets.push(() => useInventoryStore.getState().resetStore());
  } catch {}
  try {
    const { useActivationStore } = await import('@/store/useActivationStore');
    resets.push(() => useActivationStore.getState().resetActivation());
  } catch {}
  try {
    const { useSubscriptionStore } = await import('@/store/useSubscriptionStore');
    resets.push(() =>
      useSubscriptionStore.setState({
        capabilities: null,
        activeSubscription: null,
        isSubscriptionExpired: false,
        isLoading: false,
        error: null,
      }),
    );
  } catch {}
  try {
    const { usePosLoyaltyStore } = await import('@/store/usePosLoyaltyStore');
    resets.push(() =>
      usePosLoyaltyStore.setState({
        customers: [],
        lastEarnedPoints: 0,
        lastEarnedCustomerId: null,
        lastRedeemedPoints: 0,
      }),
    );
  } catch {}

  resets.forEach((reset) => {
    try {
      reset();
    } catch {}
  });
}

/**
 * Wipe everything scoped to the previous session/business so the next account
 * never sees the previous account's cached data. Called on login, signup
 * (account switch without logout) and logout.
 */
export async function resetSessionData() {
  // 1. Drop every server-fetched cache (products, staff, business profile, ...)
  try {
    // Cancel in-flight requests first: otherwise a request still carrying the
    // previous account's token can resolve after clear() and re-populate the
    // static query keys (['my-business'], ['branches']) with the old account's data.
    await queryClient.cancelQueries();
    queryClient.clear();
  } catch (e) {
    console.error('Failed to clear query cache:', e);
  }

  // 2. Clear offline IndexedDB caches (products / customers / orders / sync queue)
  try {
    await clearOfflineCache();
  } catch (e) {
    console.error('Failed to clear offline cache:', e);
  }

  // 3. Reset in-memory persisted client stores back to their defaults
  await resetClientStores();

  // 4. Drop the persisted localStorage entries for those stores
  if (typeof window !== 'undefined') {
    BUSINESS_STORAGE_KEYS.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
  }
}
