import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { DashboardAnalyticsResponse, FootfallAnalyticsResponse, PeakTimesAnalyticsResponse } from './types';

export const useDashboardAnalytics = (branchId?: string) => {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            const query = searchParams.toString();
            return await api.get(`/analytics/dashboard${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId
    });
};

export const useFootfallAnalytics = (branchId?: string) => {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<FootfallAnalyticsResponse, Error>({
        queryKey: ['footfall-analytics', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            const query = searchParams.toString();
            return await api.get(`/analytics/footfall${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId
    });
};

export const usePeakTimesAnalytics = (branchId?: string) => {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const resolvedBranchId = branchId || urlBranchId;
    const businessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<PeakTimesAnalyticsResponse, Error>({
        queryKey: ['peak-times-analytics', businessId, resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            const query = searchParams.toString();
            return await api.get(`/analytics/peak-times${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId
    });
};
