import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse } from './types';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';

const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidV4 = (value?: string | null): value is string =>
    !!value && UUID_V4_REGEX.test(value);

const normalizeRole = (role?: string | null) => String(role || '').toLowerCase();

const getReadContextParams = ({
    role,
    businessId,
    branchId,
}: {
    role?: string | null;
    businessId?: string | null;
    branchId?: string | null;
}) => {
    const params = new URLSearchParams();
    const normalizedRole = normalizeRole(role);
    const hasBranchId = isUuidV4(branchId);

    if (normalizedRole === 'owner') {
        if (hasBranchId && branchId) {
            params.append('branchId', branchId);
        } else {
            params.append('allBranches', 'true');
        }
        return params;
    }

    if (normalizedRole === 'admin') {
        if (hasBranchId && branchId) {
            params.append('branchId', branchId);
            return params;
        }
        params.append('allBranches', 'true');
        if (isUuidV4(businessId)) {
            params.append('businessId', businessId);
        }
        return params;
    }

    // Staff/Manager are branch-locked by backend token context.
    return params;
};

const getWriteBranchId = ({
    role,
    activeBranchId,
    userBranchId,
}: {
    role?: string | null;
    activeBranchId?: string | null;
    userBranchId?: string | null;
}) => {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'manager' || normalizedRole === 'staff') {
        return undefined;
    }

    const candidate = activeBranchId || userBranchId;
    if (!isUuidV4(candidate)) {
        throw new Error('A valid branchId (UUID v4) is required for this action.');
    }
    return candidate;
};

/**
 * Helper hook to resolve which branchId to use.
 * Source: explicit arg > URL param (from useActiveBranch)
 */
function useResolvedBranchParams(branchId?: string): { branchId?: string; allBranches?: boolean } {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    
    if (resolvedBranchId === 'all' || !resolvedBranchId) {
        return { allBranches: true };
    }
    return { branchId: resolvedBranchId };
}

export const useVisitors = (branchId?: string, query?: Record<string, any>) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useVisitorStats = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useNewVisitors = (branchId?: string, query?: Record<string, any>) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'new', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/new?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useNewVisitorStats = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'new', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            return await api.get(`/visitors/new/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useReturningVisitors = (branchId?: string, query?: Record<string, any>) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'returning', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            return await api.get(`/visitors/returning?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useReturningVisitorStats = (branchId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'returning', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (allBranches) {
                searchParams.set('allBranches', 'true');
            }
            return await api.get(`/visitors/returning/stats?${searchParams.toString()}`);
        },
        enabled: !!businessId,
    });
};

export const useVisitor = (id: string, branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId });

    return useQuery<any, Error>({
        queryKey: ['visitors', id, businessId, role, resolvedBranchId, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/${id}?${searchParams.toString()}`);
        },
        enabled: !!id && !!businessId,
    });
};

export const useResetDashboard = () => {
    const queryClient = useQueryClient();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const role = useAuthStore((state) => state.user?.role);
    const userBranchId = useAuthStore((state) => state.user?.branchId);

    return useMutation<void, Error, void>({
        mutationFn: async () => {
            const params = new URLSearchParams();
            const branchId = getWriteBranchId({
                role,
                activeBranchId: !activeBranchId || activeBranchId === 'all' ? undefined : activeBranchId,
                userBranchId,
            });

            if (branchId) {
                params.append('branchId', branchId);
            }

            return await api.delete(`/visitors/reset?${params.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
};
