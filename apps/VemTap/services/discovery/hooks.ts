import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import type {
    DiscoveryOverviewResponse,
    DiscoveryResultsResponse,
    DiscoverySettingsResponse,
    UpdateDiscoverySettingsDto,
    ActivePartnersList,
    PaginatedDiscoveryCustomersResponse,
    RecommendBusinessDto,
    RecommendBusinessResponse,
    NearbyPartner,
    NearbyPartnersResponse,
    PaginatedPartnershipInvitationsResponse,
    PartnershipInvitation,
    InvitePartnershipDto,
} from './types';

function useResolvedBranchParams(branchId?: string): { branchId?: string; allBranches?: boolean } {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    if (resolvedBranchId === 'all' || !resolvedBranchId) {
        return { allBranches: true };
    }
    return { branchId: resolvedBranchId };
}

export const useDiscoveryOverview = (branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<DiscoveryOverviewResponse>({
        queryKey: ['discovery', 'overview', resolvedBranchId],
        queryFn: () => api.get(`/discovery/overview/${resolvedBranchId}`),
        enabled: !!resolvedBranchId,
    });
};

export const useDiscoveryResults = (range: string = '7days', branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<DiscoveryResultsResponse>({
        queryKey: ['discovery', 'results', resolvedBranchId, range],
        queryFn: () => api.get(`/discovery/results/${resolvedBranchId}?range=${range}`),
        enabled: !!resolvedBranchId,
    });
};

export const useDiscoverySettings = (branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<DiscoverySettingsResponse>({
        queryKey: ['discovery', 'settings', resolvedBranchId],
        queryFn: () => api.get(`/discovery/settings/${resolvedBranchId}`),
        enabled: !!resolvedBranchId,
    });
};

export const useUpdateDiscoverySettings = () => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams();

    return useMutation({
        mutationFn: (data: UpdateDiscoverySettingsDto) =>
            api.patch(`/discovery/settings/${resolvedBranchId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery', 'settings'] });
        },
    });
};

export const useActivePartners = (branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<ActivePartnersList>({
        queryKey: ['discovery', 'partners', 'active', resolvedBranchId],
        queryFn: () => api.get(`/discovery/partners/${resolvedBranchId}`),
        enabled: !!resolvedBranchId,
    });
};

export const useNearbyPartners = (branchId?: string, distance?: number) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<NearbyPartnersResponse>({
        queryKey: ['discovery', 'partners', 'nearby', resolvedBranchId, distance],
        queryFn: async () => {
            let url = `/partnerships/nearby-branches?branchId=${resolvedBranchId}`;
            if (distance) url += `&distance=${distance}`;
            const res = await api.get(url);
            const partners: NearbyPartner[] = (res.data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                businessName: item.business?.name || item.name,
                type: item.business?.category || 'Business',
                distance: item.distanceMeters ? `${(item.distanceMeters / 1000).toFixed(1)} km away` : '',
                distanceInMeters: item.distanceMeters,
                latitude: item.latitude ? Number(item.latitude) : undefined,
                longitude: item.longitude ? Number(item.longitude) : undefined,
            }));
            return { data: partners, total: res.total, page: res.page, limit: res.limit };
        },
        enabled: !!resolvedBranchId,
    });
};

export const useDiscoveryCustomers = (
    params: { page?: number; limit?: number; filter?: string; branchId?: string } = {}
) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(params.branchId);
    const { page = 1, limit = 10, filter = 'all' } = params;

    return useQuery<PaginatedDiscoveryCustomersResponse>({
        queryKey: ['discovery', 'customers', resolvedBranchId, page, limit, filter],
        queryFn: () =>
            api.get(
                `/discovery/customers/${resolvedBranchId}?page=${page}&limit=${limit}&filter=${filter}`
            ),
        enabled: !!resolvedBranchId,
    });
};

export const useRecommendBusiness = () => {
    const queryClient = useQueryClient();
    const { branchId: resolvedBranchId } = useResolvedBranchParams();

    return useMutation<RecommendBusinessResponse, Error, RecommendBusinessDto>({
        mutationFn: (data: RecommendBusinessDto) =>
            api.post(`/discovery/recommend/${resolvedBranchId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery', 'partners'] });
        },
    });
};

export const usePartnershipInvitations = (params: { type?: 'sent' | 'received' | 'all'; status?: string; branchId?: string } = {}) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(params.branchId);
    const { type = 'received', status } = params;

    const queryParams = new URLSearchParams();
    if (resolvedBranchId) queryParams.set('branchId', resolvedBranchId);
    queryParams.set('type', type);
    if (status) queryParams.set('status', status);

    return useQuery<PaginatedPartnershipInvitationsResponse>({
        queryKey: ['partnerships', 'invitations', resolvedBranchId, type, status],
        queryFn: () => api.get(`/partnerships/invitations?${queryParams.toString()}`),
        enabled: !!resolvedBranchId,
    });
};

export const useInvitePartner = () => {
    const queryClient = useQueryClient();

    return useMutation<PartnershipInvitation, Error, InvitePartnershipDto>({
        mutationFn: (data) => api.post('/partnerships/invite', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partnerships'] });
            queryClient.invalidateQueries({ queryKey: ['discovery', 'partners'] });
        },
    });
};

export const useRespondToInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation<PartnershipInvitation, Error, { id: string; status: 'Accepted' | 'Declined' }>({
        mutationFn: ({ id, status }) => api.patch(`/partnerships/${id}/respond`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partnerships'] });
            queryClient.invalidateQueries({ queryKey: ['discovery', 'partners'] });
        },
    });
};

// Legacy admin mock hooks (to be replaced with real API)

export const useDiscoveryStats = () => {
    return useQuery({
        queryKey: ['discovery-stats'],
        queryFn: () => api.get('/discovery/admin/stats'),
    });
};

export const useDiscoveryBusinesses = (params?: { page?: number; limit?: number; search?: string }) => {
    const { page = 1, limit = 20, search = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);

    return useQuery({
        queryKey: ['discovery-businesses', params],
        queryFn: () => api.get(`/discovery/admin/businesses?${query.toString()}`),
    });
};


