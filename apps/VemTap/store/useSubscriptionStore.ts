import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SubscriptionCapabilities } from '@/types/subscriptions';
import { subscriptionsApi } from '@/lib/api/subscriptions';

interface SubscriptionState {
  capabilities: SubscriptionCapabilities | null;
  isLoading: boolean;
  error: string | null;
  fetchCapabilities: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isFeatureLocked: (feature: string) => boolean;
  isLimitReached: (key: 'teamMembers' | 'loyaltyPrograms' | 'branches') => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      capabilities: null,
      isLoading: false,
      error: null,

      fetchCapabilities: async () => {
        set({ isLoading: true, error: null });
        try {
          const capabilities = await subscriptionsApi.getCapabilities();
          set({ capabilities, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch capabilities', isLoading: false });
        }
      },

      hasFeature: (feature: string) => {
        const caps = get().capabilities;
        if (!caps) return false;
        return caps.capabilities.features.includes(feature);
      },

      isLimitReached: (key: 'teamMembers' | 'loyaltyPrograms' | 'branches') => {
        const caps = get().capabilities;
        if (!caps) return false;
        const item = caps.capabilities[key];
        if (!item || item.limit === 'unlimited') return false;
        return item.used >= (item.limit as number);
      },

      isFeatureLocked: (feature: string) => {
        const caps = get().capabilities;
        if (!caps) return true; // Assume locked if not loaded

        // Mapping of route/feature names to backend features or levels
        const featureMapping: Record<string, string> = {
          'analytics': 'advanced_analytics',
          'analytics_basic': 'dashboard', // basic dashboard is usually allowed
          'analytics_advanced': 'advanced_analytics',
          'loyalty': 'loyalty_programs',
          'engagement': 'automated_campaigns',
          'feedback': 'surveys_and_feedback',
          'inventory': 'inventory_management',
          'messages': 'custom_message_templates',
        };

        if (feature === 'footfall' || feature === 'peak-times') {
          return caps.capabilities.analytics === 'basic' || caps.capabilities.analytics === 'none';
        }

        const backendFeature = featureMapping[feature] || feature;
        return !caps.capabilities.features.includes(backendFeature);
      }
    }),
    {
      name: 'subscription-storage',
    }
  )
);
