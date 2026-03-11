import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SubscriptionCapabilities, Subscription } from '@/types/subscriptions';
import { subscriptionsApi } from '@/lib/api/subscriptions';

interface SubscriptionState {
  capabilities: SubscriptionCapabilities | null;
  activeSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  fetchSubscriptionData: () => Promise<void>;
  fetchCapabilities: () => Promise<void>;
  hasFeature: (feature: string) => boolean;
  isFeatureLocked: (feature: string) => boolean;
  isLimitReached: (key: 'teamMembers' | 'loyaltyPrograms' | 'branches') => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      capabilities: null,
      activeSubscription: null,
      isLoading: false,
      error: null,

      fetchSubscriptionData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Use Promise.allSettled or handle individual failures so one missing endpoint doesn't break everything
          const [capsRes, subRes] = await Promise.allSettled([
            subscriptionsApi.getCapabilities(),
            subscriptionsApi.getActiveSubscription()
          ]);
          
          const capabilities = capsRes.status === 'fulfilled' ? capsRes.value : get().capabilities;
          const activeSubscription = subRes.status === 'fulfilled' ? subRes.value : null;
          
          set({ 
            capabilities, 
            activeSubscription, 
            isLoading: false,
            error: capsRes.status === 'rejected' ? (capsRes.reason as Error).message : null 
          });
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch subscription data', isLoading: false });
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

        const featureMapping: Record<string, string> = {
          'analytics': 'advanced_analytics',
          'analytics_basic': 'dashboard', 
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
