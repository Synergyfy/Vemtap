import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '@/lib/api/customer';

export const useCustomerProfile = (customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'profile', customerUid],
        queryFn: () => customerApi.getMe(customerUid),
    });

export const useCustomerLoyaltyAnalytics = (customerUid?: string, businessId?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'analytics', customerUid, businessId],
        queryFn: () => customerApi.getLoyaltyAnalytics(customerUid, businessId),
    });

export const useCustomerLoyaltyProfile = (businessId?: string, customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'profile', businessId, customerUid],
        queryFn: () => customerApi.getLoyaltyProfile(businessId, customerUid),
    });

export const useCustomerLoyaltyHistory = (businessId?: string, customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'history', businessId, customerUid],
        queryFn: () => customerApi.getLoyaltyHistory(businessId, customerUid),
    });

export const useCustomerGlobalHistory = (customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'history', 'global', customerUid],
        queryFn: () => customerApi.getMyHistory(customerUid),
    });

export const useCustomerLoyaltyRewards = (branchId?: string | null, customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'loyalty', 'rewards', branchId, customerUid],
        queryFn: () => customerApi.getLoyaltyRewards(branchId as string, customerUid),
        enabled: !!branchId && branchId !== 'null' && branchId !== 'undefined' && branchId !== '',
    });

export const useRedeemCustomerReward = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { rewardId: string; businessId?: string; customerUid?: string }) => customerApi.redeemReward(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty'] });
            queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty', 'history', 'global'] });
        },
    });
};

export const useClaimCode = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { code: string; branchId?: string }) => customerApi.claimCode(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty'] });
            queryClient.invalidateQueries({ queryKey: ['customer', 'loyalty', 'history', 'global'] });
        },
    });
};

export const useCustomerSupportTickets = (customerUid?: string) =>
    useQuery({
        queryKey: ['customer', 'support', 'tickets', customerUid],
        queryFn: () => customerApi.getSupportTickets(customerUid),
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

