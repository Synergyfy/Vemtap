import { api } from '@/lib/api';

const withQuery = (endpoint: string, params?: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    const q = query.toString();
    return q ? `${endpoint}?${q}` : endpoint;
};

export const customerApi = {
    getMe: () => api.get('/users/profile'),
    updateMe: (data: { name?: string; phone?: string }) => api.patch('/users/profile', data),
    deactivateMe: () => api.delete('/users/profile'),

    getLoyaltyAnalytics: () => api.get('/loyalty/analytics'),
    tapDevice: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
    getDeviceInfo: (code: string) => api.get(`/tap/context/${code}`),
    getLoyaltyProfile: (businessId?: string) => api.get(withQuery('/loyalty/points/balance', { businessId })),
    getLoyaltyHistory: (businessId?: string) => api.get(withQuery('/loyalty/points/logs', { businessId })),   
    getMyHistory: () => api.get('/loyalty/points/logs'),
    getLoyaltyRewards: (branchId?: string) => api.get(`/loyalty/rewards/branch/${branchId}`),
    redeemReward: (data: { rewardId: string; businessId?: string }) => api.post('/loyalty/redemption/redeem', data),
    claimCode: (data: { code: string; branchId?: string }) => api.post('/loyalty/points/use-code', data),

    getSupportTickets: () => api.get('/support/tickets'),
    createSupportTicket: (data: { subject: string; category: string; priority: string; description: string }) =>
        api.post('/support/tickets', { subject: data.subject, category: data.category, message: data.description }),
    getSupportTicketDetails: (id: string) => api.get(`/support/tickets/${id}`),
    replyToSupportTicket: (id: string, message: string) => api.post(`/support/tickets/${id}/message`, { message }),

    visitorSignup: (data: Record<string, any>) => api.post('/visitors/signup', data),
    recordVisit: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
};

