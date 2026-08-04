import { api } from '@/lib/api';

const withQuery = (endpoint: string, params?: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });
    const q = query.toString();
    return q ? `${endpoint}?${q}` : endpoint;
};

const unwrapList = (res: any) => Array.isArray(res) ? res : (res?.data || []);

const normalizeTransactions = (list: any[]) =>
    unwrapList(list).map((tx: any) => ({
        ...tx,
        transactionType: tx.transactionType ?? tx.type,
        pointsAmount: tx.pointsAmount ?? tx.amount ?? 0,
    }));

const normalizeRewards = (list: any[]) =>
    unwrapList(list).map((r: any) => ({
        ...r,
        pointCost: r.pointCost ?? r.pointsRequired ?? 0,
        pointsRequired: r.pointsRequired ?? r.pointCost ?? 0,
    }));

export const customerApi = {
    getMe: () => api.get('/users/profile'),
    updateMe: (data: { name?: string; phone?: string }) => api.patch('/users/profile', data),
    deactivateMe: () => api.delete('/users/profile'),

    getLoyaltyAnalytics: () => api.get('/loyalty/analytics'),
    tapDevice: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
    getDeviceInfo: (code: string) => api.get(`/tap/context/${code}`),
    getLoyaltyProfile: (businessId?: string) =>
        api.get(withQuery('/loyalty/points/balance', { businessId })).then((res: any) =>
            typeof res === 'number' ? { currentPointsBalance: res } : (res && typeof res === 'object' ? res : { currentPointsBalance: 0 })
        ),
    getLoyaltyHistory: (businessId?: string) => api.get(withQuery('/loyalty/points/logs', { businessId })).then(normalizeTransactions),
    getMyHistory: () => api.get('/loyalty/points/logs').then(normalizeTransactions).catch(() => []),
    getLoyaltyRewards: (branchId?: string) =>
        api.get(`/loyalty/rewards/branch/${branchId}`).then(normalizeRewards).catch(() => []),
    redeemReward: (data: { code: string }) => api.post('/loyalty/redemption/redeem', data),
    claimCode: (data: { code: string; branchId?: string }) => api.post('/loyalty/points/use-code', data),

    getSupportTickets: () => api.get('/support/tickets'),
    createSupportTicket: (data: { subject: string; category: string; priority: string; description: string }) =>
        api.post('/support/tickets', {
            subject: data.subject,
            category: data.category,
            priority: data.priority === 'Medium' ? 'Normal' : data.priority,
            message: data.description,
        }),
    getSupportTicketDetails: (id: string) => api.get(`/support/tickets/${id}`),
    replyToSupportTicket: (id: string, message: string) => api.post(`/support/tickets/${id}/message`, { message }),

    submitFeedback: (data: { branchId: string; rating: number; comment: string; orderId?: string }) =>
        api.post('/feedback', data),

    visitorSignup: (data: Record<string, any>) => api.post('/visitors/signup', data),
    recordVisit: (code: string, payload?: { visitorId?: string; name?: string; email?: string; phone?: string }) => api.post(`/tap/record/${code}`, payload ?? {}),
};

