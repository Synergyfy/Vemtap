import { api } from '@/lib/api';
import { SubscriptionCapabilities } from '@/types/subscriptions';

export const subscriptionsApi = {
  getCapabilities: async (): Promise<SubscriptionCapabilities> => {
    return await api.get('/subscriptions/capabilities');
  },
};
