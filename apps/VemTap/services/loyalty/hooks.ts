import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { 
    LoyaltyProfile, 
    LoyaltyRule, 
    Reward, 
    PointTransaction,
    PointEarnRequest,
    PointEarnResponse,
    RewardRedeemRequest,
    RewardRedeemResponse,
    CreateRewardRequest,
    UpdateRewardRequest,
    UpdateLoyaltyRuleRequest,
    VerifyRedemptionResponse,
} from './types';

function useResolvedBranchId(branchId?: string): string | undefined {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolved = branchId || urlBranchId;
    return (resolved === 'all' || !resolved) ? undefined : resolved;
}

export const useLoyaltyProfiles = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<LoyaltyProfile[], Error>({
        queryKey: ['loyalty', 'profiles', resolvedBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.get(`/campaigns/loyalty/profiles?${params.toString()}`);
        }
    });
};

export const useLoyaltyProfile = (userId: string, branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<LoyaltyProfile, Error>({
        queryKey: ['loyalty', 'profile', userId, resolvedBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.get(`/campaigns/loyalty/profile/${userId}?${params.toString()}`);
        },
        enabled: !!userId,
    });
};

export const useLoyaltyRules = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<LoyaltyRule, Error>({
        queryKey: ['loyalty', 'rules', resolvedBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.get(`/campaigns/loyalty/rules?${params.toString()}`);
        }
    });
};

export const useUpdateLoyaltyRules = (branchId?: string) => {
    const queryClient = useQueryClient();
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useMutation<LoyaltyRule, Error, UpdateLoyaltyRuleRequest>({
        mutationFn: async (updates) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.patch(`/campaigns/loyalty/rules?${params.toString()}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rules'] });
        },
    });
};

export const useRewards = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<Reward[], Error>({
        queryKey: ['loyalty', 'rewards', resolvedBranchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.get(`/campaigns/loyalty/rewards?${params.toString()}`);
        }
    });
};

export const useBusinessLoyaltyStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<any, Error>({
        queryKey: ['loyalty', 'business-stats', resolvedBranchId, businessId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.get(`/campaigns/loyalty/business-stats?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useCreateReward = (branchId?: string) => {
    const queryClient = useQueryClient();
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useMutation<Reward, Error, CreateRewardRequest>({
        mutationFn: async (dto) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/campaigns/loyalty/rewards?${params.toString()}`, dto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
        },
    });
};

export const useUpdateReward = (branchId?: string) => {
    const queryClient = useQueryClient();
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useMutation<Reward, Error, { id: string; updates: UpdateRewardRequest }>({
        mutationFn: async ({ id, updates }) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.patch(`/campaigns/loyalty/rewards/${id}?${params.toString()}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
        },
    });
};

export const useEarnPoints = () => {
    const queryClient = useQueryClient();

    return useMutation<PointEarnResponse, Error, PointEarnRequest>({
        mutationFn: async (dto) => await api.post('/campaigns/loyalty/earn', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const useRedeemReward = () => {
    const queryClient = useQueryClient();

    return useMutation<RewardRedeemResponse, Error, RewardRedeemRequest>({
        mutationFn: async (dto) => await api.post('/campaigns/loyalty/redeem', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const useVerifyRedemption = (branchId?: string) => {
    const queryClient = useQueryClient();
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useMutation<VerifyRedemptionResponse, Error, string>({
        mutationFn: async (code) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/campaigns/loyalty/verify-redemption?${params.toString()}`, { code });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const usePointTransactions = (profileId: string) => {
    return useQuery<PointTransaction[], Error>({
        queryKey: ['loyalty', 'transactions', profileId],
        queryFn: async () => await api.get(`/campaigns/loyalty/transactions/${profileId}`),
        enabled: !!profileId,
    });
};
