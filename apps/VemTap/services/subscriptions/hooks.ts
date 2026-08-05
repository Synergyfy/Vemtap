import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';

export const useActiveSubscription = () => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    
    return useQuery<Subscription, Error>({
        queryKey: ['subscription', 'active', businessId],
        queryFn: async () => {
            return await api.get('/subscriptions/active');
        },
        enabled: !!businessId,
    });
};

export const useCapabilities = () => {
    const businessId = useAuthStore((state) => state.user?.businessId);
    
    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities', businessId],
        queryFn: async () => {
            return await api.get('/subscriptions/capabilities');
        },
        enabled: !!businessId,
    });
};

import { useSubscriptionStore } from '@/store/useSubscriptionStore';

export const useSubscribe = () => {
    const queryClient = useQueryClient();
    const refreshSubscriptionData = useSubscriptionStore((state) => state.refreshSubscriptionData);

    return useMutation<Subscription, Error, SubscribeRequest>({
        mutationFn: async (dto) => await api.post('/subscriptions/subscribe', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
            // Silently refresh the Zustand store so the active plan updates
            // immediately without unmounting/remounting the current page
            refreshSubscriptionData();
        },
    });
};
