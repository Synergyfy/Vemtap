import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Mock data for initial development
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
        queryFn: async () => {
            // In production, this would be an API call
            // return api.get('/admin/discovery/stats');
            return MOCK_DISCOVERY_STATS;
        },
    });
};

export const useDiscoveryBusinesses = (params?: any) => {
    return useQuery({
        queryKey: ['discovery-businesses', params],
        queryFn: async () => {
            // Mocking the business list
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
