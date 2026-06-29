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

export const useNearbyPartners = (branchId?: string) => {
    const { branchId: resolvedBranchId } = useResolvedBranchParams(branchId);

    return useQuery<NearbyPartner[]>({
        queryKey: ['discovery', 'partners', 'nearby', resolvedBranchId],
        queryFn: () => api.get(`/partnerships/nearby?branchId=${resolvedBranchId}`),
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

const MOCK_DISCOVERY_STATS = {
    totalBusinesses: 124,
    activeOffers: 342,
    scheduledOffers: 45,
    expiredOffers: 89,
    totalOfferViews: 12540,
    totalOfferClicks: 3420,
    referralsGenerated: 856,
    referralsCompleted: 234,
    couponsRedeemed: 189,
    attributedSales: 156,
    attributedRevenue: 2450000,
    sponsoredRevenue: 450000,
    activePartnerships: 64,
    notificationsSent: 4520,
    avgConversionRate: 2.8,
};

export const useDiscoveryStats = () => {
    return useQuery({
        queryKey: ['discovery-stats'],
        queryFn: async () => MOCK_DISCOVERY_STATS,
    });
};

export const useDiscoveryBusinesses = (params?: any) => {
    return useQuery({
        queryKey: ['discovery-businesses', params],
        queryFn: async () => {
            return {
                data: [
                    {
                        id: '1',
                        name: 'Fashion Hub',
                        category: 'Fashion',
                        plan: 'Premium',
                        location: 'Wuse 2',
                        status: 'Active',
                        activeOffers: 5,
                        referralsSent: 42,
                        referralsReceived: 28,
                        revenueGenerated: 145000,
                        dateJoined: '2026-01-15',
                    },
                    {
                        id: '2',
                        name: 'The Grill House',
                        category: 'Restaurant',
                        plan: 'Standard',
                        location: 'Wuse 2',
                        status: 'Active',
                        activeOffers: 3,
                        referralsSent: 15,
                        referralsReceived: 35,
                        revenueGenerated: 210000,
                        dateJoined: '2026-02-10',
                    },
                ],
                meta: { total: 2 }
            };
        },
    });
};


