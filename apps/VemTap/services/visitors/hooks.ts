import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse } from './types';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Helper – resolves which branchId to use.
 * Priority: explicit arg > activeBranchId (from BranchSwitcher) > user.businessId
 * Falls back to businessId so calls still work for single-branch businesses.
 */
function useResolvedBranchId(branchId?: string): string | undefined {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    // 'all' means no filter – pass nothing so backend returns all
    const resolved = branchId || (activeBranchId === 'all' ? undefined : activeBranchId) || userBusinessId;
    return resolved || undefined;
}

export const useVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
    });
};

export const useVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
    });
};

export const useNewVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'new', resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/new?${searchParams.toString()}`);
        },
    });
};

export const useNewVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'new', 'stats', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/new/stats?${searchParams.toString()}`);
        },
    });
};

export const useReturningVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'returning', resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/returning?${searchParams.toString()}`);
        },
    });
};

export const useReturningVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'returning', 'stats', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/returning/stats?${searchParams.toString()}`);
        },
    });
};

export const useVisitor = (id: string, branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<any, Error>({
        queryKey: ['visitors', id, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/${id}?${searchParams.toString()}`);
        },
        enabled: !!id,
    });
};
