import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';

export const useActiveSubscription = () => {
    return useQuery<Subscription, Error>({
        queryKey: ['subscription', 'active'],
        queryFn: async () => await api.get('/subscriptions/active'),
    });
};

export const useCapabilities = () => {
    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities'],
        queryFn: async () => await api.get('/subscriptions/capabilities'),
    });
};

export const useSubscribe = () => {
    const queryClient = useQueryClient();

    return useMutation<Subscription, Error, SubscribeRequest>({
        mutationFn: async (dto) => await api.post('/subscriptions/subscribe', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
        },
    });
};
