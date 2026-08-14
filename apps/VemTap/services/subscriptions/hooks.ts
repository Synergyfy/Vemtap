import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';

export const useActiveSubscription = () => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.access_token);
    const businessId = user?.businessId;
    
    return useQuery<Subscription, Error>({
        // Scope the key to the business AND session token so a stale cache entry
        // from a previous account can never be served on a different account,
        // even across a client-side (no page reload) account switch.
        queryKey: ['subscription', 'active', businessId, token ?? 'anon'],
        queryFn: async ({ signal }) => {
            return await api.get('/subscriptions/active', { signal });
        },
        enabled: !!businessId,
    });
};

export const useCapabilities = () => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.access_token);
    const businessId = user?.businessId;
    
    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities', businessId, token ?? 'anon'],
        queryFn: async ({ signal }) => {
            return await api.get('/subscriptions/capabilities', { signal });
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
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
            // Silently refresh the Zustand store so the active plan updates
            // immediately without unmounting/remounting the current page
            refreshSubscriptionData();
            // Write the plan onto the auth store immediately so dashboard gating
            // (hasPlan) never sees a stale "no plan" state right after paying.
            useAuthStore.setState((s) => ({
                user: s.user ? { ...s.user, planId: variables.planId } : s.user,
            }));
        },
    });
};
