
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PublicBusinessResponse, PublicBranchResponse, PublicReward } from './types';

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

export const usePublicRewards = (businessId: string, enabled = true) => {
    return useQuery<PublicReward[], Error>({
        queryKey: ['public', 'rewards', businessId],
        queryFn: async () => {
            const response = await api.get(`/loyalty/rewards?businessId=${businessId}`);
            // Assuming the API returns an array of rewards under a `data` property 
            // or as the main response, and that only active rewards are returned.
            return Array.isArray(response) ? response : response?.data || [];
        },
        enabled: enabled && !!businessId,
    });
};
