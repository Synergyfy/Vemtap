import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';

export const useActiveSubscription = (businessId?: string) => {
    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBusinessId = businessId || userBusinessId;

    return useQuery<Subscription, Error>({
        queryKey: ['subscription', 'active', resolvedBusinessId],
        queryFn: async () => await api.get(`/subscriptions/active/${resolvedBusinessId}`),
        enabled: !!resolvedBusinessId,
    });
};

export const useCapabilities = (businessId?: string) => {
    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBusinessId = businessId || userBusinessId;

    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities', resolvedBusinessId],
        queryFn: async () => await api.get(`/subscriptions/capabilities/${resolvedBusinessId}`),
        enabled: !!resolvedBusinessId,
    });
};

export const useSubscribe = () => {
    const queryClient = useQueryClient();

    return useMutation<Subscription, Error, SubscribeRequest>({
        mutationFn: async (dto) => await api.post('/subscriptions/subscribe', dto),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active', variables.businessId] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
        },
    });
};
