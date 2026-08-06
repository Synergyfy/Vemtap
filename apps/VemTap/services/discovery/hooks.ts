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
    AdminPaginatedResponse,
    AdminStatsResponse,
    AdminBusinessesResponse,
    AdminOffer,
    AdminOfferDetail,
    AdminReferral,
    AdminReferralInvestigation,
    AdminPartnership,
    AdminSponsoredCampaign,
    AdminSponsoredCampaignDetail,
    AdminBillingTransaction,
    AdminBillingDetail,
    AdminAttribution,
    AdminCustomer,
    AdminCustomerDetail,
    AdminLocation,
    AdminLocationDetail,
    AdminCategory,
    AdminCategoryDetail,
    AdminCategoryType,
    AdminFraudDashboard,
    AdminNotification,
    AdminReport,
    AdminAuditLog,
    AdminAuditLogDetail,
    AdminDiscoverySettings,
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

// =============== ADMIN HOOKS ===============

export const useDiscoveryStats = () => {
    return useQuery<AdminStatsResponse>({
        queryKey: ['discovery-stats'],
        queryFn: () => api.get('/discovery/admin/stats'),
    });
};

export const useDiscoveryBusinesses = (params?: { page?: number; limit?: number; search?: string }) => {
    const { page = 1, limit = 20, search = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);

    return useQuery<AdminBusinessesResponse>({
        queryKey: ['discovery-businesses', params],
        queryFn: () => api.get(`/discovery/admin/businesses?${query.toString()}`),
    });
};

export const useDiscoveryBusinessDetail = (id: string) => {
    return useQuery<Record<string, any>>({
        queryKey: ['discovery-business', id],
        queryFn: () => api.get(`/discovery/admin/businesses/${id}`),
        enabled: !!id,
    });
};

export const useAdminOffers = (params?: { page?: number; limit?: number; search?: string; status?: string; category?: string }) => {
    const { page = 1, limit = 10, search = '', status = '', category = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    if (category) query.set('category', category);
    return useQuery<AdminPaginatedResponse<AdminOffer>>({
        queryKey: ['discovery-admin-offers', params],
        queryFn: () => api.get(`/discovery/admin/offers?${query.toString()}`),
    });
};

export const useAdminOffer = (id: string) => {
    return useQuery<AdminOfferDetail>({
        queryKey: ['discovery-admin-offer', id],
        queryFn: () => api.get(`/discovery/admin/offers/${id}`),
        enabled: !!id,
    });
};

export const useAdminReferrals = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const { page = 1, limit = 10, search = '', status = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    return useQuery<AdminPaginatedResponse<AdminReferral>>({
        queryKey: ['discovery-admin-referrals', params],
        queryFn: () => api.get(`/discovery/admin/referrals?${query.toString()}`),
    });
};

export const useAdminReferralInvestigation = (id: string) => {
    return useQuery<AdminReferralInvestigation>({
        queryKey: ['discovery-admin-referral-investigate', id],
        queryFn: () => api.get(`/discovery/admin/referrals/${id}/investigate`),
        enabled: !!id,
    });
};

export const useAdminPartnerships = (params?: { page?: number; limit?: number; status?: string }) => {
    const { page = 1, limit = 10, status = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    return useQuery<AdminPaginatedResponse<AdminPartnership>>({
        queryKey: ['discovery-admin-partnerships', params],
        queryFn: () => api.get(`/discovery/admin/partnerships?${query.toString()}`),
    });
};

export const useAdminSponsoredCampaigns = (params?: { page?: number; limit?: number; status?: string }) => {
    const { page = 1, limit = 10, status = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    return useQuery<AdminPaginatedResponse<AdminSponsoredCampaign>>({
        queryKey: ['discovery-admin-sponsored', params],
        queryFn: () => api.get(`/discovery/admin/sponsored?${query.toString()}`),
    });
};

export const useAdminSponsoredCampaign = (id: string) => {
    return useQuery<AdminSponsoredCampaignDetail>({
        queryKey: ['discovery-admin-sponsored', id],
        queryFn: () => api.get(`/discovery/admin/sponsored/${id}`),
        enabled: !!id,
    });
};

export const useAdminBilling = (params?: { page?: number; limit?: number; status?: string; type?: string }) => {
    const { page = 1, limit = 10, status = '', type = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    if (type) query.set('type', type);
    return useQuery<AdminPaginatedResponse<AdminBillingTransaction>>({
        queryKey: ['discovery-admin-billing', params],
        queryFn: () => api.get(`/discovery/admin/billing?${query.toString()}`),
    });
};

export const useAdminBillingDetail = (id: string) => {
    return useQuery<AdminBillingDetail>({
        queryKey: ['discovery-admin-billing', id],
        queryFn: () => api.get(`/discovery/admin/billing/${id}`),
        enabled: !!id,
    });
};

export const useAdminAttribution = () => {
    return useQuery<AdminAttribution>({
        queryKey: ['discovery-admin-attribution'],
        queryFn: () => api.get('/discovery/admin/attribution'),
    });
};

export const useAdminCustomers = (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const { page = 1, limit = 10, search = '', status = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    return useQuery<AdminPaginatedResponse<AdminCustomer>>({
        queryKey: ['discovery-admin-customers', params],
        queryFn: () => api.get(`/discovery/admin/customers?${query.toString()}`),
    });
};

export const useAdminCustomer = (id: string) => {
    return useQuery<AdminCustomerDetail>({
        queryKey: ['discovery-admin-customer', id],
        queryFn: () => api.get(`/discovery/admin/customers/${id}`),
        enabled: !!id,
    });
};

export const useAdminLocations = (params?: { page?: number; limit?: number; search?: string }) => {
    const { page = 1, limit = 10, search = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    return useQuery<AdminPaginatedResponse<AdminLocation>>({
        queryKey: ['discovery-admin-locations', params],
        queryFn: () => api.get(`/discovery/admin/locations?${query.toString()}`),
    });
};

export const useAdminLocation = (id: string) => {
    return useQuery<AdminLocationDetail>({
        queryKey: ['discovery-admin-location', id],
        queryFn: () => api.get(`/discovery/admin/locations/${id}`),
        enabled: !!id,
    });
};

export const useAdminCategories = (params?: { page?: number; limit?: number; search?: string }) => {
    const { page = 1, limit = 10, search = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    return useQuery<AdminPaginatedResponse<AdminCategory>>({
        queryKey: ['discovery-admin-categories', params],
        queryFn: () => api.get(`/discovery/admin/categories?${query.toString()}`),
    });
};

export const useAdminCategory = (id: string) => {
    return useQuery<AdminCategoryDetail>({
        queryKey: ['discovery-admin-category', id],
        queryFn: () => api.get(`/discovery/admin/categories/${id}`),
        enabled: !!id,
    });
};

export const useAdminCategoryTypes = (params?: { page?: number; limit?: number }) => {
    const { page = 1, limit = 10 } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    return useQuery<AdminPaginatedResponse<AdminCategoryType>>({
        queryKey: ['discovery-admin-category-types', params],
        queryFn: () => api.get(`/discovery/admin/category-types?${query.toString()}`),
    });
};

export const useCreateAdminCategoryType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; description?: string; status?: string }) =>
            api.post('/discovery/admin/category-types', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery-admin-category-types'] });
        },
    });
};

export const useUpdateAdminCategoryType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string; status?: string }) =>
            api.patch(`/discovery/admin/category-types/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery-admin-category-types'] });
        },
    });
};

export const useDeleteAdminCategoryType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/discovery/admin/category-types/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery-admin-category-types'] });
        },
    });
};

export const useAdminFraudAlerts = (params?: { page?: number; limit?: number; status?: string; severity?: string }) => {
    const { page = 1, limit = 10, status = '', severity = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set('status', status);
    if (severity) query.set('severity', severity);
    return useQuery<AdminFraudDashboard>({
        queryKey: ['discovery-admin-fraud', params],
        queryFn: () => api.get(`/discovery/admin/fraud?${query.toString()}`),
    });
};

export const useAdminNotifications = (params?: { page?: number; limit?: number; channel?: string }) => {
    const { page = 1, limit = 10, channel = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (channel) query.set('channel', channel);
    return useQuery<AdminPaginatedResponse<AdminNotification>>({
        queryKey: ['discovery-admin-notifications', params],
        queryFn: () => api.get(`/discovery/admin/notifications?${query.toString()}`),
    });
};

export const useAdminReports = (params?: { page?: number; limit?: number }) => {
    const { page = 1, limit = 10 } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    return useQuery<AdminPaginatedResponse<AdminReport>>({
        queryKey: ['discovery-admin-reports', params],
        queryFn: () => api.get(`/discovery/admin/reports?${query.toString()}`),
    });
};

export const useGenerateAdminReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; type: string; dateRange?: string }) =>
            api.post('/discovery/admin/reports/generate', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery-admin-reports'] });
        },
    });
};

export const useAdminAuditLogs = (params?: { page?: number; limit?: number; search?: string; date?: string }) => {
    const { page = 1, limit = 10, search = '', date = '' } = params || {};
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) query.set('search', search);
    if (date) query.set('date', date);
    return useQuery<AdminPaginatedResponse<AdminAuditLog>>({
        queryKey: ['discovery-admin-audit-logs', params],
        queryFn: () => api.get(`/discovery/admin/audit-logs?${query.toString()}`),
    });
};

export const useAdminAuditLog = (id: string) => {
    return useQuery<AdminAuditLogDetail>({
        queryKey: ['discovery-admin-audit-log', id],
        queryFn: () => api.get(`/discovery/admin/audit-logs/${id}`),
        enabled: !!id,
    });
};

export const useAdminDiscoverySettings = () => {
    return useQuery<AdminDiscoverySettings>({
        queryKey: ['discovery-admin-settings'],
        queryFn: () => api.get('/discovery/admin/settings'),
    });
};

export const useUpdateAdminDiscoverySettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, any>) => api.patch('/discovery/admin/settings', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discovery-admin-settings'] });
        },
    });
};


