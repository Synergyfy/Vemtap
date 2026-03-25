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
    getMe: (customerUid?: string) => api.get(withQuery('/users/profile', { customerUid })),
    updateMe: (data: { name?: string; phone?: string }) => api.patch('/users/profile', data),
    deactivateMe: () => api.delete('/users/profile'),

    getLoyaltyAnalytics: (customerUid?: string, businessId?: string) => api.get(withQuery('/loyalty/analytics', { customerUid, businessId })),
    tapDevice: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
    getDeviceInfo: (code: string) => api.get(`/tap/context/${code}`),
    getLoyaltyProfile: (businessId?: string, customerUid?: string) => api.get(withQuery('/loyalty/points/balance', { businessId, customerUid })),
    getLoyaltyHistory: (businessId?: string, customerUid?: string) => api.get(withQuery('/loyalty/points/logs', { businessId, customerUid })),   
    getMyHistory: (customerUid?: string) => api.get(withQuery('/loyalty/points/logs', { customerUid })),
    getLoyaltyRewards: (branchId?: string, customerUid?: string) => api.get(withQuery(`/loyalty/rewards/branch/${branchId}`, { customerUid })),
    redeemReward: (data: { rewardId: string; businessId?: string; customerUid?: string }) => api.post('/loyalty/redemption/redeem', data),
    claimCode: (data: { code: string; branchId?: string; customerUid?: string }) => api.post('/loyalty/points/use-code', data),

    getSupportTickets: (customerUid?: string) => api.get(withQuery('/support/tickets', { customerUid })),
    createSupportTicket: (data: { subject: string; category: string; priority: string; description: string; customerUid?: string }) =>
        api.post(withQuery('/support/tickets', { customerUid: data.customerUid }), { subject: data.subject, category: data.category, message: data.description }),
    getSupportTicketDetails: (id: string, customerUid?: string) => api.get(withQuery(`/support/tickets/${id}`, { customerUid })),
    replyToSupportTicket: (id: string, message: string, customerUid?: string) => api.post(withQuery(`/support/tickets/${id}/message`, { customerUid }), { message }),

    visitorSignup: (data: Record<string, any>) => api.post('/visitors/signup', data),
    recordVisit: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
};

