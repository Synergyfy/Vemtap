import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PaginatedVisitorResponse, VisitorStatsResponse, Visitor } from './types';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMemo } from 'react';

// --- Constants ---
const STALE_TIME = 30 * 1000; // 30 seconds
const GC_TIME = 5 * 60 * 1000; // 5 minutes

// --- Helpers ---

export const normalizeRole = (role?: string | null) => role?.toLowerCase().trim() || '';

export const isUuidV4 = (id?: string | null) => {
    if (!id) return false;
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return regex.test(id);
};

export const getReadContextParams = ({
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
        if (businessId && isUuidV4(businessId)) {
            params.append('businessId', businessId);
        }
        return params;
    }

    // Staff/Manager are branch-locked by backend token context.
    return params;
};

export const useResolvedBranchParams = (branchId?: string) => {
    const { activeBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || activeBranchId;

    return useMemo(() => {
        if (resolvedBranchId === 'all') {
            return { allBranches: true, branchId: undefined };
        }
        return { branchId: resolvedBranchId, allBranches: false };
    }, [resolvedBranchId]);
}

export const useVisitors = (branchId?: string, query?: Record<string, any>, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    const stableQuery = useMemo(() => JSON.stringify(query || {}), [query]);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', businessId, role, resolvedBranchId, allBranches, stableQuery, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.segmentId) searchParams.append('segmentId', query.segmentId);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useVisitor = (id: string, branchId?: string) => {
    return useQuery<Visitor, Error>({
        queryKey: ['visitors', id, branchId],
        queryFn: async () => {
            const qs = branchId ? `?branchId=${branchId}` : '';
            return await api.get(`/visitors/${id}${qs}`);
        },
        enabled: !!id,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useVisitorStats = (branchId?: string, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useNewVisitors = (branchId?: string, query?: Record<string, any>, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    const stableQuery = useMemo(() => JSON.stringify(query || {}), [query]);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'new', businessId, role, resolvedBranchId, allBranches, stableQuery, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors/new?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useNewVisitorStats = (branchId?: string, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'new', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/new/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useReturningVisitors = (branchId?: string, query?: Record<string, any>, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    const stableQuery = useMemo(() => JSON.stringify(query || {}), [query]);

    return useQuery<PaginatedVisitorResponse, Error>({
        queryKey: ['visitors', 'returning', businessId, role, resolvedBranchId, allBranches, stableQuery, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            if (query?.status) searchParams.append('status', query.status);
            if (query?.page) searchParams.append('page', String(query.page));
            return await api.get(`/visitors/returning?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useReturningVisitorStats = (branchId?: string, enabled: boolean = true) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    return useQuery<VisitorStatsResponse, Error>({
        queryKey: ['visitors', 'returning', 'stats', businessId, role, resolvedBranchId, allBranches, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            return await api.get(`/visitors/returning/stats?${searchParams.toString()}`);
        },
        enabled: isAuthenticated && isStaff && enabled,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
};

export const useMessagingVisitorsByBranch = (branchId?: string, query?: Record<string, any>) => {
    const { branchId: resolvedBranchId, allBranches } = useResolvedBranchParams(branchId);
    const businessId = useAuthStore((state) => state.user?.businessId);
    const role = useAuthStore((state) => state.user?.role);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isStaff = ['owner', 'admin', 'manager', 'staff'].includes(normalizeRole(role));
    
    const contextParams = useMemo(() => 
        getReadContextParams({ role, businessId, branchId: resolvedBranchId, allBranches }),
        [role, businessId, resolvedBranchId, allBranches]
    );

    const stableQuery = useMemo(() => JSON.stringify(query || {}), [query]);

    return useQuery<Visitor[]>({
        queryKey: ['messaging-visitors', businessId, role, resolvedBranchId, allBranches, stableQuery, contextParams.toString()],
        queryFn: async () => {
            const searchParams = new URLSearchParams(contextParams);
            if (query?.search) searchParams.append('search', query.search);
            // Use high limit to get more visitors for the selection dropdown
            searchParams.append('limit', '500'); 
            const response = await api.get(`/visitors?${searchParams.toString()}`);
            // API returns paginated { data: [...], total, page, limit } or a flat array
            const visitors = Array.isArray(response) ? response : (response?.data || response?.visitors || []);
            // Normalize each visitor to ensure a unified 'name' field exists
            return (visitors as any[]).map((v: any) => ({
                ...v,
                name: v.name || 
                    (v.firstName || v.lastName 
                        ? `${v.firstName || ''} ${v.lastName || ''}`.trim() 
                        : 'Unknown Visitor'),
            }));
        },
        enabled: isAuthenticated && isStaff,
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: false,
    });
}

export const useUpdateVisitor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Visitor> }) => {
            return await api.patch(`/visitors/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
        }
    });
};

export const useResetDashboard = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (branchId?: string | void) => {
            const qs = typeof branchId === 'string' ? `?branchId=${branchId}` : '';
            return await api.post(`/visitors/reset-dashboard${qs}`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['visitors'] });
        }
    });
};
