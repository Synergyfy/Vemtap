import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse } from './types';
import { useAuthStore } from '@/store/useAuthStore';

// Temporary fallback query string builder until businessId resolves as branchId implicitly
export const useVisitors = (branchId?: string, query?: Record<string, any>) => {
    const userRole = useAuthStore((state) => state.user?.role);
    const userBranchId = useAuthStore((state) => state.user?.businessId);

    const activeBranchId = branchId || userBranchId;

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', activeBranchId, query],
        queryFn: async () => {
            // Pass branchId along with any search constraints
            const searchParams = new URLSearchParams();
            if (activeBranchId) searchParams.append('branchId', activeBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);

            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: !!activeBranchId,
    });
};

export const useVisitorStats = (branchId?: string) => {
    const userBranchId = useAuthStore((state) => state.user?.businessId);
    const activeBranchId = branchId || userBranchId;

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', activeBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (activeBranchId) searchParams.append('branchId', activeBranchId);

            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
        enabled: !!activeBranchId,
    });
};
