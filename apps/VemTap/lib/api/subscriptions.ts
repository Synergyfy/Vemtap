import { api } from '@/lib/api';
import { SubscriptionCapabilities, Subscription } from '@/types/subscriptions';

export const subscriptionsApi = {
  getCapabilities: async (): Promise<SubscriptionCapabilities> => {
    return await api.get('/subscriptions/capabilities');
  },
  getActiveSubscription: async (): Promise<Subscription> => {
    return await api.get('/subscriptions/active');
  },
};
