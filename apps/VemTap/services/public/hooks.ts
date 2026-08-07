
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    EarnVisitorPointsResponse,
    PublicBusinessResponse,
    PublicBranchResponse,
    PublicRewardsResponse,
} from './types';

export const usePublicBusiness = (code: string, enabled = true) => {
    return useQuery<PublicBusinessResponse, Error>({
        queryKey: ['public', 'business', code],
        queryFn: async () => {
            const data = await api.get(`/public/businesses/code/${code}`);
            return data;
        },
        enabled: enabled && !!code,
    });
};

export const usePublicBranch = (code: string, enabled = true) => {
    return useQuery<PublicBranchResponse, Error>({
        queryKey: ['public', 'branch', code],
        queryFn: async () => {
            const data = await api.get(`/public/branches/code/${code}`);
            return data;
        },
        enabled: enabled && !!code,
    });
};

export interface PublicRewardsQuery {
    branchId?: string;
    branchCode?: string;
    businessId?: string;
    search?: string;
    newest?: boolean;
    oldest?: boolean;
    lowestQuantity?: boolean;
    highestQuantity?: boolean;
    aboutToExpire?: boolean;
    highestPoints?: boolean;
    lowestPoints?: boolean;
    page?: number;
    limit?: number;
}

const REWARD_SORT_FLAGS = [
    'newest',
    'oldest',
    'lowestQuantity',
    'highestQuantity',
    'aboutToExpire',
    'highestPoints',
    'lowestPoints',
] as const;

export const usePublicRewards = (params: PublicRewardsQuery = {}, enabled = true) => {
    const { branchId, branchCode, businessId, search, page, limit, ...rest } = params;
    return useQuery<PublicRewardsResponse, Error>({
        queryKey: ['public', 'rewards', params],
        queryFn: async () => {
            const query = new URLSearchParams();
            if (branchId) query.set('branchId', branchId);
            if (branchCode) query.set('branchCode', branchCode);
            if (businessId) query.set('businessId', businessId);
            if (search) query.set('search', search);
            if (page !== undefined) query.set('page', String(page));
            if (limit !== undefined) query.set('limit', String(limit));
            for (const flag of REWARD_SORT_FLAGS) {
                if (rest[flag]) query.set(flag, 'true');
            }
            return await api.get(`/public/loyalty/rewards?${query.toString()}`);
        },
        enabled: enabled && !!(branchId || branchCode || businessId),
    });
};

export interface EarnVisitorPointsInput {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    branchId?: string;
    branchCode?: string;
    isVisit?: boolean;
}

export const useEarnVisitorPoints = () => {
    return useMutation<EarnVisitorPointsResponse, Error, EarnVisitorPointsInput>({
        mutationFn: async (payload) => {
            return await api.post('/loyalty/visitor/points/earn', payload);
        },
    });
};
