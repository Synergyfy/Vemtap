import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Subscription, SubscriptionCapabilities, SubscribeRequest } from './types';

export const useActiveSubscription = () => {
    const { activeBranchId, isAllBranches } = useActiveBranch();
    const businessId = useAuthStore((state) => state.user?.businessId);
    
    return useQuery<Subscription, Error>({
        queryKey: ['subscription', 'active', businessId, activeBranchId, isAllBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeBranchId) {
                params.set('branchId', activeBranchId);
            } else if (isAllBranches) {
                params.set('allBranches', 'true');
            }
            const query = params.toString();
            return await api.get(`/subscriptions/active${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId,
    });
};

export const useCapabilities = () => {
    const { activeBranchId, isAllBranches } = useActiveBranch();
    const businessId = useAuthStore((state) => state.user?.businessId);
    
    return useQuery<SubscriptionCapabilities, Error>({
        queryKey: ['subscription', 'capabilities', businessId, activeBranchId, isAllBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeBranchId) {
                params.set('branchId', activeBranchId);
            } else if (isAllBranches) {
                params.set('allBranches', 'true');
            }
            const query = params.toString();
            return await api.get(`/subscriptions/capabilities${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId,
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
