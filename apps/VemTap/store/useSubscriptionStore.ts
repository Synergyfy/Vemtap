import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SubscriptionCapabilities, Subscription } from '@/types/subscriptions';
import { subscriptionsApi } from '@/lib/api/subscriptions';

interface SubscriptionState {
  capabilities: SubscriptionCapabilities | null;
  activeSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  isSubscriptionExpired: boolean;
  forceLockedFeatures: string[];
  setSubscriptionExpired: (expired: boolean) => void;
  fetchSubscriptionData: () => Promise<void>;
  refreshSubscriptionData: () => Promise<void>;
  fetchCapabilities: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isFeatureLocked: (feature: string) => boolean;
  markFeatureLocked: (feature: string) => void;
  isLimitReached: (key: 'teamMembers' | 'loyaltyPrograms' | 'branches' | 'catalogueItems' | 'catalogueCategories' | 'catalogueOffers') => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      capabilities: null,
      activeSubscription: null,
      isSubscriptionExpired: false,
      setSubscriptionExpired: (expired: boolean) => set({ isSubscriptionExpired: expired }),
      isLoading: false,
      error: null,

      // In-memory only — reset on page refresh
      forceLockedFeatures: [] as string[],

      fetchSubscriptionData: async () => {
        set({ isLoading: true, error: null });
        await get().refreshSubscriptionData();
        set({ isLoading: false });
      },

      // Background refresh - never toggles isLoading so mounted UI
      // (modals, pages) is not unmounted/re-rendered mid-flow
      refreshSubscriptionData: async () => {
        try {
          const [capsRes, subRes] = await Promise.allSettled([
            subscriptionsApi.getCapabilities(),
            subscriptionsApi.getActiveSubscription()
          ]);
          
          const capabilities = capsRes.status === 'fulfilled' ? capsRes.value : get().capabilities;
          const activeSubscription = subRes.status === 'fulfilled' ? subRes.value : get().activeSubscription;
          
          const isExpired = activeSubscription?.status === 'expired' || activeSubscription?.status === 'cancelled';
          
          set({ 
            capabilities, 
            activeSubscription, 
            isSubscriptionExpired: isExpired,
            error: capsRes.status === 'rejected' ? (capsRes.reason as Error).message : null 
          });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch subscription data' });
        }
      },

      fetchCapabilities: async () => {
        set({ isLoading: true, error: null });
        try {
          const capabilities = await subscriptionsApi.getCapabilities();
          set({ capabilities, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch capabilities', isLoading: false });
        }
      },

      markFeatureLocked: (feature: string) => {
        set(state => ({
          forceLockedFeatures: state.forceLockedFeatures.includes(feature)
            ? state.forceLockedFeatures
            : [...state.forceLockedFeatures, feature],
        }));
      },

      hasFeature: (feature: string) => {
        const caps = get().capabilities;
        if (!caps) return false;
        return caps.capabilities.features.includes(feature);
      },

      isLimitReached: (key: 'teamMembers' | 'loyaltyPrograms' | 'branches' | 'catalogueItems' | 'catalogueCategories' | 'catalogueOffers') => {
        const caps = get().capabilities;
        if (!caps) return false;
        const item = caps.capabilities[key];
        if (!item || !item.enabled) return true;
        if (item.limit === 'unlimited' || item.limit === -1) return false;
        return item.used >= (item.limit as number);
      },

      isFeatureLocked: (feature: string) => {
        // Check force-locked first (from actual 403 responses)
        if (get().forceLockedFeatures.includes(feature)) return true;

        const caps = get().capabilities;
        if (!caps) return true;

        const featureMapping: Record<string, string> = {
          'analytics': 'analytics',
          'analytics_basic': 'analytics', 
          'analytics_advanced': 'analytics',
          'footfall': 'analytics',
          'peak-times': 'analytics',
          'visitors': 'analytics',
          'loyalty': 'loyalty_programs',
          'engagement': 'automated_campaigns',
          'feedback': 'surveys_and_feedback',
          'inventory': 'inventory_management',
          'messages': 'messaging',
          'branches': 'branches',
          'teamMembers': 'teamMembers',
          'staff': 'teamMembers',
          'messaging': 'messaging',
          'catalogue': 'catalogue',
          'pos': 'pos',
          'catalogue_items': 'catalogueItems',
          'catalogue_categories': 'catalogueCategories',
          'catalogue_offers': 'catalogueOffers',
          'marketing-kit': 'marketingKit',
          'discovery': 'discovery',
        };

        const backendFeature = featureMapping[feature] || feature;

        if (backendFeature === 'analytics') {
          if (feature === 'footfall' || feature === 'peak-times') {
            return !caps.capabilities.analytics.enabled || caps.capabilities.analytics.level === 'none';
          }
          return !caps.capabilities.analytics.enabled;
        }

        if (backendFeature === 'messaging') {
          return !caps.capabilities.messaging.enabled;
        }

        if (backendFeature === 'loyalty' || backendFeature === 'loyalty_programs') {
          return !caps.capabilities.loyaltyPrograms.enabled;
        }

        if (backendFeature === 'branches') {
          return !caps.capabilities.branches.enabled;
        }

        if (backendFeature === 'teamMembers') {
          return !caps.capabilities.teamMembers.enabled;
        }

        if (backendFeature === 'catalogue' || backendFeature === 'catalogueItems') {
          return !caps.capabilities.catalogueItems?.enabled;
        }

        if (backendFeature === 'catalogueCategories') {
          return !caps.capabilities.catalogueCategories?.enabled;
        }

        if (backendFeature === 'catalogueOffers') {
          return !caps.capabilities.catalogueOffers?.enabled;
        }

        // General check: if the capability exists on the response object with an 'enabled' field, use that directly
        const cap = (caps.capabilities as any)[backendFeature] || (caps.capabilities as any)[feature];
        if (cap && typeof cap.enabled === 'boolean') {
          return !cap.enabled;
        }

        return !caps.capabilities.features.includes(backendFeature);
      }
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        capabilities: state.capabilities,
        activeSubscription: state.activeSubscription,
        isSubscriptionExpired: state.isSubscriptionExpired,
      }),
    }
  )
);
