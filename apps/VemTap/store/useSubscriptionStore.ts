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

      isFeatureLocked: (feature: string) => {
        // Analytics and Engagement are now free for all
        if (feature === 'analytics' || feature === 'engagement') return false;

        const caps = get().capabilities;
        if (!caps) return true; // Assume locked if not loaded

        // Mapping of route/feature names to backend features
        const featureMapping: Record<string, string> = {
          'analytics': 'advanced_analytics',
          'loyalty': 'loyalty_programs',
          'engagement': 'automated_campaigns',
          'feedback': 'surveys_and_feedback',
          'inventory': 'inventory_management',
          'messages': 'custom_message_templates',
        };

        const backendFeature = featureMapping[feature] || feature;
        return !caps.capabilities.features.includes(backendFeature);
      }
    }),
    {
      name: 'subscription-storage',
    }
  )
);
