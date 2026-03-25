import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse, Visitor } from './types';
import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import toast from 'react-hot-toast';

const UUID_V4_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuidV4 = (value?: string | null): value is string =>
    !!value && (UUID_V4_REGEX.test(value) || value.length >= 3);

const normalizeRole = (role?: string | null) => String(role || '').toLowerCase();

const getReadContextParams = ({
    role,
    businessId,
    branchId,
    allBranches,
}: {
    role?: string | null;
    businessId?: string | null;
    branchId?: string | null;
    allBranches?: boolean;
}) => {
    const params = new URLSearchParams();
    const normalizedRole = normalizeRole(role);
    const hasBranchId = isUuidV4(branchId);
    const isAdminOrAgent = normalizedRole === 'admin' || normalizedRole === 'agent';

    // If we have a specific branchId, add it.
    if (hasBranchId) {
        params.append('branchId', branchId);
    }

    // If it's an admin/agent and we have an override businessId, ALWAYS add it.
    // This is crucial for Sudo mode / Control Tower views.
    if (isAdminOrAgent && isUuidV4(businessId)) {
        params.set('businessId', businessId);
    }

    // Handle 'all branches' view for natural Owners
    if (allBranches && normalizedRole === 'owner') {
        params.append('allBranches', 'true');
    }
    
    // For admins, allBranches=true is only needed if not viewing a specific branch
    if (allBranches && normalizedRole === 'admin' && !hasBranchId) {
        params.set('allBranches', 'true');
    }

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

export const useVisitors = (branchId?: string, query?: Record<string, any>, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || query?.businessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useVisitorStats = (branchId?: string, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useNewVisitors = (branchId?: string, query?: Record<string, any>, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'new', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors/new?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useNewVisitorStats = (branchId?: string, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'new', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/new/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useReturningVisitors = (branchId?: string, query?: Record<string, any>, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'returning', businessId, role, resolvedBranchId, allBranches, query, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors/returning?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useReturningVisitorStats = (branchId?: string, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches });

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'returning', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/returning/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated,
    });
};

export const useMessagingVisitors = (branchId?: string, query?: Record<string, any>) => {
    const { data: visitorsData, ...rest } = useVisitors(branchId, query);

    const formattedVisitors = (visitorsData?.data || []).map((v) => ({
        id: v.id,
        name: v.name || `${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Anonymous Visitor',
        phone: v.phone,
        email: v.email,
        isOnline: false,
        status: v.status,
        tags: (v as any).tags,
    }));

    return {
        ...rest,
        data: formattedVisitors,
        total: visitorsData?.total || 0,
    };
};

export const useMessagingVisitorsByBranch = (branchId?: string, query?: Record<string, any>) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    const { data: visitorsData, ...rest } = useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'messaging', branchId, query],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            if (branchId) searchParams.append('branchId', branchId);
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && !!branchId,
    });

    const formattedVisitors = (visitorsData?.data || []).map((v) => ({
        id: v.id,
        name: v.name || `${v.firstName || ''} ${v.lastName || ''}`.trim() || 'Anonymous Visitor',
        phone: v.phone,
        email: v.email,
        isOnline: false,
        status: v.status,
        tags: (v as any).tags,
    }));

    return {
        ...rest,
        data: formattedVisitors,
        total: visitorsData?.total || 0,
    };
};

export const useVisitor = (id: string, branchId?: string, overrideBusinessId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const businessId = overrideBusinessId || authBusinessId;
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const contextParams = getReadContextParams({ role, businessId, branchId: resolvedBranchId });

    return useQuery<any, Error>({
        queryKey: ['visitors', id, businessId, role, resolvedBranchId, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/${id}?${searchParams.toString()}`);
        },
        enabled: !!id && isAuthenticated,
    });
};

export const useResetDashboard = () => {
    const queryClient = useQueryClient();
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const role = useAuthStore((state) => state.user?.role);
    const userBranchId = useAuthStore((state) => state.user?.branchId);

    return useMutation<void, Error, { businessId?: string } | void>({
        mutationFn: async (args) => {
            const businessId = (args as any)?.businessId;
            const params = new URLSearchParams();
            const branchId = getWriteBranchId({
                role,
                activeBranchId: !activeBranchId || activeBranchId === 'all' ? undefined : activeBranchId,
                userBranchId,
            });

            if (branchId) {
                params.append('branchId', branchId);
            }

            if (businessId && (role === 'admin' || role === 'agent')) {
                params.append('businessId', businessId);
            }

            return await api.delete(`/visitors/reset?${params.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
};

export const useAddVisitor = () => {
    const queryClient = useQueryClient();
    const role = useAuthStore((state) => state.user?.role);

    return useMutation<any, Error, { data: any; businessId?: string; branchId?: string }>({
        mutationFn: async ({ data, businessId, branchId }) => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            if (businessId && (role === 'admin' || role === 'agent')) {
                params.append('businessId', businessId);
            }
            return await api.post(`/visitors?${params.toString()}`, data);
        },
        onSuccess: (_, { businessId }) => {
            queryClient.invalidateQueries({ queryKey: ['visitors', businessId] });
            toast.success('Visitor added successfully');
        },
    });
};

export const useDeleteVisitor = () => {
    const queryClient = useQueryClient();
    const role = useAuthStore((state) => state.user?.role);

    return useMutation<void, Error, { id: string; businessId?: string }>({
        mutationFn: async ({ id, businessId }) => {
            const params = new URLSearchParams();
            if (businessId && (role === 'admin' || role === 'agent')) {
                params.append('businessId', businessId);
            }
            return await api.delete(`/visitors/${id}?${params.toString()}`);
        },
        onSuccess: (_, { businessId }) => {
            queryClient.invalidateQueries({ queryKey: ['visitors', businessId] });
            toast.success('Visitor removed successfully');
        },
    });
};

export const useUpdateVisitor = () => {
    const queryClient = useQueryClient();
    const role = useAuthStore((state) => state.user?.role);

    return useMutation<any, Error, { id: string; data: Partial<Visitor>; businessId?: string }>({
        mutationFn: async ({ id, data, businessId }) => {
            const params = new URLSearchParams();
            if (businessId && (role === 'admin' || role === 'agent')) {
                params.append('businessId', businessId);
            }
            return await api.patch(`/visitors/${id}?${params.toString()}`, data);
        },
        onSuccess: (_, { businessId }) => {
            queryClient.invalidateQueries({ queryKey: ['visitors', businessId] });
        }
    });
};

export const useCreateReward = () => {
    const queryClient = useQueryClient();
    const role = useAuthStore((state) => state.user?.role);

    return useMutation<any, Error, { data: any; businessId?: string }>({
        mutationFn: async ({ data, businessId }) => {
            const params = new URLSearchParams();
            if (businessId && (role === 'admin' || role === 'agent')) {
                params.append('businessId', businessId);
            }
            return await api.post(`/visitors/rewards?${params.toString()}`, data);
        },
        onSuccess: (_, { businessId }) => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', businessId] });
            toast.success('Reward created successfully');
        },
    });
};
