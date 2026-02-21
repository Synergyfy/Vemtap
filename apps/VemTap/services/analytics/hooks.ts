import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DashboardAnalyticsResponse } from './types';

export const useDashboardAnalytics = () => {
    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics'],
        queryFn: async () => {
            const response = await api.get('/analytics/dashboard');
            return response;
        }
    });
};
