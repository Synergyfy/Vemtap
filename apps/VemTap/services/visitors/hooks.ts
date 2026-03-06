import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse } from './types';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';

/**
 * Helper hook – resolves which branchId to use.
 * Source: explicit arg > URL param (from useActiveBranch)
 */
function useResolvedBranchId(branchId?: string): string | undefined {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolved = branchId || urlBranchId;
    return (resolved === 'all' || !resolved) ? undefined : resolved;
}

export const useVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', businessId, resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useNewVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'new', businessId, resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/new?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useNewVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'new', 'stats', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/new/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useReturningVisitors = (branchId?: string, query?: Record<string, any>) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'returning', businessId, resolvedBranchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/returning?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useReturningVisitorStats = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'returning', 'stats', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/returning/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useVisitor = (id: string, branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<any, Error>({
        queryKey: ['visitors', id, businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/visitors/${id}?${searchParams.toString()}`);
        },
        enabled: !!id && !!businessId,
    });
};

export const useResetDashboard = () => {
    const queryClient = useQueryClient();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            const params = new URLSearchParams();
            if (activeBranchId) params.append('branchId', activeBranchId);
            return await api.delete(`/visitors/reset?${params.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
};
