import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/dashboard';
import { useBusinessStore } from '@/store/useBusinessStore';
import { DashboardAnalyticsResponse } from './types';

export const useDashboardAnalytics = () => {
    const { activeBranchId } = useBusinessStore();

    return useQuery<DashboardAnalyticsResponse, Error>({
        queryKey: ['dashboard-analytics', activeBranchId],
        queryFn: async () => {
            const data = await dashboardApi.fetchDashboardData();
            
            // Map mock data to the expected response format
            const response: DashboardAnalyticsResponse = {
                stats: [
                    { 
                        label: 'Total Visits', 
                        value: data.stats.totalVisitors.toLocaleString(), 
                        trend: '+12%', 
                        isUp: true 
                    },
                    { 
                        label: 'New Customers', 
                        value: data.stats.newVisitors.toLocaleString(), 
                        trend: '+5%', 
                        isUp: true 
                    },
                    { 
                        label: 'Repeat Rate', 
                        value: `${data.stats.totalVisitors > 0 ? Math.round((data.stats.repeatVisitors / data.stats.totalVisitors) * 100) : 0}%`, 
                        trend: '+8%', 
                        isUp: true 
                    },
                    { 
                        label: 'Avg. Stay Time', 
                        value: '42m', 
                        trend: '-2%', 
                        isUp: false 
                    },
                ],
                peakTimes: data.activityData.map(a => ({
                    hour: a.hour,
                    value: a.visits
                })),
                messagingRoi: [
                    { label: 'Campaign Reach', value: '12.4k' },
                    { label: 'Conversion', value: '8.2%', sub: '+1.2% this week' },
                ],
                engagementQuality: {
                    surveyCompletion: '64%',
                    reviewConversion: '12%',
                    socialFollows: '245'
                },
                topPerformers: [
                    { label: 'Ikeja Main Entrance', type: 'Device' },
                    { label: 'Weekend Promo', type: 'Campaign' }
                ],
                recentVisitors: data.recentVisitors
            };

            return response;
        }
    });
};
