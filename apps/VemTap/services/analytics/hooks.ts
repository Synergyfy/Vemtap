import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore, AuthState } from '../../store/useAuthStore';
import { DashboardAnalyticsResponse, FootfallAnalyticsResponse, PeakTimesAnalyticsResponse } from './types';

function useResolvedBranchId(branchId?: string): string | undefined {
    const activeBranchId = useAuthStore((state: AuthState) => state.activeBranchId);
    // Default analytics scope is all branches unless a specific branch is selected.
    if (branchId === 'all' || (!branchId && activeBranchId === 'all')) {
        return undefined;
    }
    return branchId || activeBranchId || undefined;
}

export const useDashboardAnalytics = (branchId?: string) => {
    const resolvedBranchId = useResolvedBranchId(branchId);

    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics', resolvedBranchId],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) searchParams.append('branchId', resolvedBranchId);
            const query = searchParams.toString();
            return await api.get(`/analytics/dashboard${query ? `?${query}` : ''}`);
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
            const query = searchParams.toString();
            return await api.get(`/analytics/footfall${query ? `?${query}` : ''}`);
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
            const query = searchParams.toString();
            return await api.get(`/analytics/peak-times${query ? `?${query}` : ''}`);
        }
    });
};
