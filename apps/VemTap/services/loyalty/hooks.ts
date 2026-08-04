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
    BusinessLoyaltyStats,
    CustomerAnalytics,
    ClaimCodeResponse,
    ApplyTemplateResponse,
    Redemption,
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

export const useRewards = (branchId?: string, enabled: boolean = true) => {
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
            if (resolvedBranchId) {
                return await api.get(`/loyalty/rewards/branch/${resolvedBranchId}`);
            }
            return await api.get(`/loyalty/rewards?${params.toString()}`);
        },
        enabled: enabled,
    });
};

export const useReward = (id: string) => {
    return useQuery<Reward, Error>({
        queryKey: ['loyalty', 'reward', id],
        queryFn: async () => await api.get(`/loyalty/item-details/${id}`),
        enabled: !!id,
    });
};

export const useRewardRedemptions = (rewardId: string) => {
    return useQuery<Redemption[], Error>({
        queryKey: ['loyalty', 'rewards', rewardId, 'redemptions'],
        queryFn: async () => {
            return await api.get(`/loyalty/rewards/${rewardId}/redemptions`);
        },
        enabled: !!rewardId,
    });
};

export const useBusinessLoyaltyStats = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<BusinessLoyaltyStats, Error>({
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
            // Try DTO, then hook arg, then resolved branch
            const bId = dto.branchId || branchId || resolvedBranchId;
            if (bId && bId !== 'all') {
                params.append('branchId', bId);
            }
            const payload = { ...dto };
            delete payload.totalAvailable;
            return await api.post(`/loyalty/rewards?${params.toString()}`, payload);
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
            const bId = updates.branchId || branchId || resolvedBranchId;
            if (bId && bId !== 'all') {
                params.append('branchId', bId);
            }
            const payload = { ...updates };
            delete payload.totalAvailable;
            return await api.patch(`/loyalty/rewards/${id}?${params.toString()}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
        },
    });
};

export const useDeleteReward = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.delete(`/loyalty/rewards/${id}?${params.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
            notify.success('Reward deleted successfully');
        },
        onError: (error) => {
            notify.error(error.message || 'Failed to delete reward');
        }
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
    return useQuery<CustomerAnalytics, Error>({
        queryKey: ['loyalty', 'analytics'],
        queryFn: async () => await api.get('/loyalty/analytics')
    });
};

export const useLoyaltyHistory = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    return useQuery<(PointTransaction | Redemption)[], Error>({
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
    return useMutation<Redemption, Error, { rewardId: string; branchId?: string }>({
        mutationFn: async (dto) => {
            const result: any = await api.post('/loyalty/redemption/generate-code', dto);
            return { ...result, redemptionCode: result.redemptionCode ?? result.code };
        }
    });
};

export const useClaimRedemptionCode = () => {
    const queryClient = useQueryClient();
    return useMutation<ClaimCodeResponse, Error, { code: string; branchId?: string }>({
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
        queryFn: async () => await api.get('/loyalty/reward-templates')
    });
};

import { notify } from '@/lib/notify';

export const useCreateLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<LoyaltyTemplate, Error, Partial<LoyaltyTemplate>>({
        mutationFn: async (data) => await api.post('/loyalty/reward-templates', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
            notify.success('Template created successfully');
        },
        onError: (error) => {
            notify.error(error.message || 'Failed to create loyalty template');
        }
    });
};

export const useUpdateLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<LoyaltyTemplate, Error, { id: string; updates: Partial<LoyaltyTemplate> }>({
        mutationFn: async ({ id, updates }) => await api.patch(`/loyalty/reward-templates/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
            notify.success('Template updated successfully');
        },
        onError: (error) => {
            notify.error(error.message || 'Failed to update loyalty template');
        }
    });
};

export const useDeleteLoyaltyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/loyalty/reward-templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'templates'] });
            notify.success('Template deleted successfully');
        },
        onError: (error) => {
            notify.error(error.message || 'Failed to delete loyalty template');
        }
    });
};

export const useApplyLoyaltyTemplate = (branchId?: string) => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useMutation<ApplyTemplateResponse, Error, string>({
        mutationFn: async (id) => {
            const params = new URLSearchParams();
            if (resolvedBranchId) params.append('branchId', resolvedBranchId);
            return await api.post(`/loyalty/reward-templates/${id}/apply?${params.toString()}`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rewards'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty', 'rules'] });
        }
    });
};

export const usePointsBalance = (businessId: string) => {
    return useQuery<{ balance: number }, Error>({
        queryKey: ['loyalty', 'points-balance', businessId],
        queryFn: async () => {
            const res = await api.get(`/loyalty/points/balance?businessId=${businessId}`);
            return typeof res === 'number' ? { balance: res } : (res && typeof res === 'object' ? res : { balance: 0 });
        },
        enabled: !!businessId,
    });
};

export const usePointsLogs = (params: { businessId: string; page?: number; limit?: number }) => {
    return useQuery<{ data: PointTransaction[]; total: number; page: number; limit: number }, Error>({
        queryKey: ['loyalty', 'points-logs', params],
        queryFn: async () => {
            const q = new URLSearchParams();
            q.set('businessId', params.businessId);
            if (params.page) q.set('page', String(params.page));
            if (params.limit) q.set('limit', String(params.limit));
            return await api.get(`/loyalty/points/logs?${q.toString()}`);
        },
        enabled: !!params.businessId,
    });
};

export const useBusinessPointLogs = (params: { businessId: string; branchId?: string; page?: number; limit?: number }) => {
    return useQuery<{ data: PointTransaction[]; total: number; page: number; limit: number }, Error>({
        queryKey: ['loyalty', 'business-point-logs', params],
        queryFn: async () => {
            const q = new URLSearchParams();
            q.set('businessId', params.businessId);
            if (params.branchId) q.set('branchId', params.branchId);
            if (params.page) q.set('page', String(params.page));
            if (params.limit) q.set('limit', String(params.limit));
            return await api.get(`/loyalty/points/business-logs?${q.toString()}`);
        },
        enabled: !!params.businessId,
    });
};
