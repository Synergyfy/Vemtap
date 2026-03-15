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
    LoyaltyTemplate,
} from './types';

function useResolvedBranchParams(branchId?: string): { branchId?: string; allBranches?: boolean } {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    
    if (resolvedBranchId === 'all' || !resolvedBranchId) {
        return { allBranches: true };
    }
    return { branchId: resolvedBranchId };
}

export const useLoyaltyProfiles = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);

    return useQuery<LoyaltyProfile[], Error>({
        queryKey: ['loyalty', 'profiles', resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) {
                params.append('branchId', resolvedBranchId);
            } else if (allBranches) {
                params.append('allBranches', 'true');
            }
            return await api.get(`/loyalty/profiles?${params.toString()}`);
        }
    });
};

export const useLoyaltyProfile = (userId: string, branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);

    return useQuery<LoyaltyProfile, Error>({
        queryKey: ['loyalty', 'profile', userId, resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) {
                params.append('branchId', resolvedBranchId);
            } else if (allBranches) {
                params.append('allBranches', 'true');
            }
            return await api.get(`/loyalty/profile/${userId}?${params.toString()}`);
        },
        enabled: !!userId,
    });
};

export const useLoyaltyRules = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);

    return useQuery<LoyaltyRule, Error>({
        queryKey: ['loyalty', 'rules', resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) {
                params.append('branchId', resolvedBranchId);
            } else if (allBranches) {
                params.append('allBranches', 'true');
            }
            return await api.get(`/loyalty/rules?${params.toString()}`);
        }
    });
};

export const useUpdateLoyaltyRules = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<LoyaltyRule, Error, UpdateLoyaltyRuleRequest>({
        mutationFn: async (updates) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.patch(`/loyalty/rules?${params.toString()}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rules'] });
        },
    });
};

export const useRewards = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);

    return useQuery<Reward[], Error>({
        queryKey: ['loyalty', 'rewards', resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) {
                params.append('branchId', resolvedBranchId);
            } else if (allBranches) {
                params.append('allBranches', 'true');
            }
            return await api.get(`/loyalty/rewards?${params.toString()}`);
        }
    });
};

export const useBusinessLoyaltyStats = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<any, Error>({
        queryKey: ['loyalty', 'business-stats', resolvedBranchId, allBranches, businessId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) {
                params.append('branchId', resolvedBranchId);
            } else if (allBranches) {
                params.append('allBranches', 'true');
            }
            return await api.get(`/loyalty/business-stats?${params.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useCreateReward = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<Reward, Error, CreateRewardRequest>({
        mutationFn: async (dto) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/loyalty/rewards?${params.toString()}`, dto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
        },
    });
};

export const useUpdateReward = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<Reward, Error, { id: string; updates: UpdateRewardRequest }>({
        mutationFn: async ({ id, updates }) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.patch(`/loyalty/rewards/${id}?${params.toString()}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
        },
    });
};

export const useEarnPoints = () => {
    const queryClient = useQueryClient();

    return useMutation<PointEarnResponse, Error, PointEarnRequest>({
        mutationFn: async (dto) => await api.post('/loyalty/earn', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const useRedeemReward = () => {
    const queryClient = useQueryClient();

    return useMutation<RewardRedeemResponse, Error, RewardRedeemRequest>({
        mutationFn: async (dto) => await api.post('/loyalty/redeem', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const useVerifyRedemption = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<VerifyRedemptionResponse, Error, string>({
        mutationFn: async (code) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/loyalty/verify-redemption?${params.toString()}`, { code });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        },
    });
};

export const useLoyaltyAnalytics = () => {
    return useQuery<any, Error>({
        queryKey: ['loyalty', 'analytics'],
        queryFn: async () => await api.get('/loyalty/analytics')
    });
};

export const useLoyaltyHistory = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    return useQuery<any[], Error>({
        queryKey: ['loyalty', 'history', resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            else if (allBranches) params.append('allBranches', 'true');
            return await api.get(`/loyalty/history?${params.toString()}`);
        }
    });
};

export const useGenerateRedemptionCode = () => {
    return useMutation<any, Error, { rewardId: string; branchId?: string }>({
        mutationFn: async (dto) => await api.post('/loyalty/generate-code', dto)
    });
};

export const useClaimRedemptionCode = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { code: string; branchId?: string }>({
        mutationFn: async (dto) => await api.post('/loyalty/claim-code', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty'] });
        }
    });
};

export const usePointTransactions = (profileId: string) => {
    return useQuery<PointTransaction[], Error>({
        queryKey: ['loyalty', 'transactions', profileId],
        queryFn: async () => await api.get(`/loyalty/transactions/${profileId}`),
        enabled: !!profileId,
    });
};

export const useLoyaltyTemplates = () => {
    return useQuery<LoyaltyTemplate[], Error>({
        queryKey: ['loyalty', 'templates'],
        queryFn: async () => await api.get('/loyalty/templates')
    });
};

export const useCreateLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<LoyaltyTemplate, Error, Partial<LoyaltyTemplate>>({
        mutationFn: async (data) => await api.post('/loyalty/templates', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
        }
    });
};

export const useUpdateLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<LoyaltyTemplate, Error, { id: string; updates: Partial<LoyaltyTemplate> }>({
        mutationFn: async ({ id, updates }) => await api.patch(`/loyalty/templates/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
        }
    });
};

export const useDeleteLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/loyalty/templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
        }
    });
};

export const useApplyLoyaltyTemplate = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<any, Error, string>({
        mutationFn: async (id) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/loyalty/templates/${id}/apply?${params.toString()}`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rules'] });
        }
    });
};
