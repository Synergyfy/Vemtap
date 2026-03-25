import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { DashboardAnalyticsResponse, FootfallAnalyticsResponse, PeakTimesAnalyticsResponse } from './types';



export const useDashboardAnalytics = (branchId?: string, businessId?: string) => {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBusinessId = businessId || authBusinessId;
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics', resolvedBusinessId, resolvedBranchId, isAllBranches],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) {
                searchParams.append('branchId', resolvedBranchId);
            } else if (isAllBranches) {
                searchParams.set('allBranches', 'true');
            }
            if (businessId) {
                searchParams.append('businessId', businessId);
            }
            const query = searchParams.toString();
            return await api.get(`/analytics/dashboard${query ? `?${query}` : ''}`);
        },
        enabled: isAuthenticated
    });
};

export const useFootfallAnalytics = (branchId?: string, businessId?: string) => {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBusinessId = businessId || authBusinessId;
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery<FootfallAnalyticsResponse, Error>({
        queryKey: ['footfall-analytics', resolvedBusinessId, resolvedBranchId, isAllBranches],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) {
                searchParams.append('branchId', resolvedBranchId);
            } else if (isAllBranches) {
                searchParams.append('allBranches', 'true');
            }
            if (businessId) {
                searchParams.append('businessId', businessId);
            }
            const query = searchParams.toString();
            return await api.get(`/analytics/footfall${query ? `?${query}` : ''}`);
        },
        enabled: isAuthenticated
    });
};

export const usePeakTimesAnalytics = (branchId?: string, businessId?: string) => {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const authBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolvedBusinessId = businessId || authBusinessId;

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    return useQuery<PeakTimesAnalyticsResponse, Error>({
        queryKey: ['peak-times-analytics', resolvedBusinessId, resolvedBranchId, isAllBranches],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) {
                searchParams.append('branchId', resolvedBranchId);
            } else if (isAllBranches) {
                searchParams.append('allBranches', 'true');
            }
            if (businessId) {
                searchParams.append('businessId', businessId);
            }
            const query = searchParams.toString();
            return await api.get(`/analytics/peak-times${query ? `?${query}` : ''}`);
        },
        enabled: isAuthenticated
    });
};
