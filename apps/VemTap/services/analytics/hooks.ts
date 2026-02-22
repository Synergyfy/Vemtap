import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { DashboardAnalyticsResponse, FootfallAnalyticsResponse, PeakTimesAnalyticsResponse } from './types';

function useResolvedBranchId(branchId?: string): string | undefined {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBusinessId = useAuthStore((state) => state.user?.businessId);
    const resolved = branchId || (activeBranchId === 'all' ? undefined : activeBranchId) || userBusinessId;
    return resolved || undefined;
}

export const useDashboardAnalytics = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/analytics/dashboard?${searchParams.toString()}`);
        }
    });
};

export const useFootfallAnalytics = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<FootfallAnalyticsResponse, Error>({
        queryKey: ['footfall-analytics', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/analytics/footfall?${searchParams.toString()}`);
        }
    });
};

export const usePeakTimesAnalytics = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<PeakTimesAnalyticsResponse, Error>({
        queryKey: ['peak-times-analytics', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            return await api.get(`/analytics/peak-times?${searchParams.toString()}`);
        }
    });
};
