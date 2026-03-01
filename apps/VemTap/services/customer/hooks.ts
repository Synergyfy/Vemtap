import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/api/customer';

export const useCustomerProfile = () =>
    useQuery({
        queryKey: ['customer', 'profile'],
        queryFn: () => customerApi.getMe(),
    });

export const useCustomerLoyaltyAnalytics = () =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'analytics'],
        queryFn: () => customerApi.getLoyaltyAnalytics(),
    });

export const useCustomerLoyaltyProfile = (businessId?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'profile', businessId],
        queryFn: () => customerApi.getLoyaltyProfile(businessId),
    });

export const useCustomerLoyaltyHistory = (businessId?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'history', businessId],
        queryFn: () => customerApi.getLoyaltyHistory(businessId),
    });

export const useCustomerLoyaltyRewards = (businessId?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'rewards', businessId],
        queryFn: () => customerApi.getLoyaltyRewards(businessId),
    });

export const useRedeemCustomerReward = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { rewardId: string; businessId?: string }) => customerApi.redeemReward(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty'] });
        },
    });
};

export const useCustomerSupportTickets = () =>
    useQuery({
        queryKey: ['customer', 'support', 'tickets'],
        queryFn: () => customerApi.getSupportTickets(),
    });

export const useCreateCustomerSupportTicket = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { subject: string; category: string; priority: string; description: string }) =>
            customerApi.createSupportTicket(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'support', 'tickets'] });
        },
    });
};

