import { api } from '@/lib/api';

// =====================
// USERS (Admin)
// =====================
export const adminUsersApi = {
    getAll: (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.role) q.set('role', params.role);
        if (params?.status) q.set('status', params.status);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/users/admin?${q.toString()}`);
    },
    getStats: () => api.get('/users/admin/stats'),
    create: (data: any) => api.post('/users/admin', data),
    update: (id: string, data: any) => api.patch(`/users/admin/${id}`, data),
    delete: (id: string) => api.delete(`/users/admin/${id}`),
    suspend: (id: string) => api.post(`/users/admin/${id}/suspend`, {}),
    activate: (id: string) => api.post(`/users/admin/${id}/activate`, {}),
    resetPassword: (email: string) => api.post(`/users/admin/reset-password-link/${email}`, {}),
    createAgent: (data: any) => api.post('/administration/agents', data),
};

// =====================
// BUSINESSES (Admin)
// =====================
export const adminBusinessesApi = {
    getAll: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.status) q.set('status', params.status);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/businesses/admin?${q.toString()}`);
    },
    create: (data: any) => api.post('/businesses/admin', data),
    delete: (id: string) => api.delete(`/businesses/admin/${id}`),
    approve: (id: string) => api.patch(`/businesses/admin/${id}/approve`, {}),
    reject: (id: string) => api.patch(`/businesses/admin/${id}/reject`, {}),
    suspend: (id: string, reason?: string) => api.patch(`/businesses/admin/${id}/suspend`, { reason }),
    reactivate: (id: string) => api.patch(`/businesses/admin/${id}/reactivate`, {}),
    verify: (id: string) => api.patch(`/businesses/admin/${id}/verify`, {}),
    unverify: (id: string) => api.patch(`/businesses/admin/${id}/unverify`, {}),
    getSuspended: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/businesses/admin/suspended?${q.toString()}`);
    },
    getPendingVerification: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/businesses/admin/pending-verification?${q.toString()}`);
    },
    update: (id: string, data: any) => api.patch(`/businesses/${id}`, data),
    getStats: (id: string) => api.get(`/businesses/admin/${id}/stats`),
};

// =====================
// DEVICES (Admin)
// =====================
export const adminDevicesApi = {
    getAll: (params?: { search?: string; status?: string; branchId?: string; businessId?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.status) q.set('status', params.status);
        if (params?.branchId) q.set('branchId', params.branchId);
        if (params?.businessId) q.set('businessId', params.businessId);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/devices/admin?${q.toString()}`);
    },
    getStats: () => api.get('/devices/admin/stats'),
    create: (data: any) => api.post('/devices/admin', data),
    update: (id: string, data: any) => api.patch(`/devices/admin/${id}`, data),
    delete: (id: string) => api.delete(`/devices/admin/${id}`),
};

// =====================
// PRODUCTS (Admin)
// =====================
export const adminProductsApi = {
    getAll: () => api.get('/products/admin'),
    getStats: () => api.get('/products/admin/stats'),
    create: (data: any) => api.post('/products', data),
    update: (id: string, data: any) => api.patch(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),

    // Orders & Quotes
    getAllOrders: () => api.get('/products/orders/all'),
    getAllQuotes: () => api.get('/products/quotes/all'),
    markOrderReady: (id: string) => api.patch(`/products/orders/${id}/ready`, {}),
    negotiateQuote: (id: string, data: any) => api.post(`/products/quotes/${id}/negotiate`, data),

    // Product Types
    getAllTypes: () => api.get('/products/types'),
    createType: (data: any) => api.post('/products/types', data),
    updateType: (id: string, data: any) => api.patch(`/products/types/${id}`, data),
    deleteType: (id: string) => api.delete(`/products/types/${id}`),
    getCountByType: (productTypeId: string) => api.get(`/products/count-by-type/${productTypeId}`),
};

// =====================
// SUBSCRIPTIONS (Admin)
// =====================
export const adminSubscriptionsApi = {
    getAll: (params?: { search?: string; status?: string; range?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.status) q.set('status', params.status);
        if (params?.range) q.set('range', params.range);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/subscriptions/admin?${q.toString()}`);
    },
    getStats: () => api.get('/subscriptions/admin/stats'),
    subscribe: (data: { planId: string; businessId: string; billingPeriod: 'monthly' | 'yearly'; paymentReference?: string; isTrial?: boolean }) =>
        api.post('/subscriptions/subscribe', data),
};

// =====================
// ANALYTICS (Admin)
// =====================
export const adminAnalyticsApi = {
    getAdminSummary: () => api.get('/analytics/admin/summary'),
    getBusinessSummary: () => api.get('/analytics/admin/business-summary'),
};

export const adminFormsApi = {
    getTemplates: (params?: { search?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/form-templates?${q.toString()}`);
    },
    getTemplatesStats: () => api.get('/form-templates/stats'),
    getTemplateStats: (id: string) => api.get(`/form-templates/${id}/stats`),
    
    // Business Forms Management
    getBusinessForms: (params?: { search?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/admin-forms?${q.toString()}`);
    },
    disableBusinessForm: (id: string) => api.patch(`/admin-forms/${id}/disable`, {}),
    enableBusinessForm: (id: string) => api.patch(`/admin-forms/${id}/enable`, {}),

    // Template Management
    createTemplate: (data: any) => api.post('/form-templates', data),
    updateTemplate: (id: string, data: any) => api.patch(`/form-templates/${id}`, data),
    deleteTemplate: (id: string) => api.delete(`/form-templates/${id}`),
    getTemplate: (id: string) => api.get(`/form-templates/${id}`),
    useTemplate: (templateId: string, branchId: string) => api.post(`/form-templates/${templateId}/use?branchId=${branchId}`, {}),
};

export const adminSupportApi = {
    getAllTickets: () => api.get('/support/admin/tickets'),
    getTicketDetails: (id: string) => api.get(`/support/admin/tickets/${id}`),
    updateTicketStatus: (id: string, status: 'Open' | 'In Progress' | 'Closed') =>
        api.post(`/support/admin/tickets/${id}/status`, { status }),
    replyToTicket: (id: string, message: string) => api.post(`/support/admin/tickets/${id}/message`, { message }),
    assignTicket: (id: string, agentId: string) => api.post(`/support/admin/tickets/${id}/assign`, { agentId }),
    resolveTicket: (id: string) => adminSupportApi.updateTicketStatus(id, 'Closed'),
};

export const adminMessagingApi = {
    getAllTemplates: () => api.get('/messaging/admin/templates'),
    getAvailableTemplates: () => api.get('/messaging/templates'),
    createTemplate: (data: {
        name: string;
        channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
        content: string;
        category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
        language?: string;
        isSystem?: boolean;
    }) => api.post('/messaging/templates', data),
    updateTemplateStatus: (id: string, status: 'pending' | 'approved' | 'rejected') =>
        api.post(`/messaging/admin/templates/${id}/status`, { status }),
    deleteTemplate: (id: string) => api.delete(`/messaging/templates/${id}/delete`),
};

export const adminNotificationsApi = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    markAllRead: () => api.post('/notifications/mark-all-read', {}),
    registerPushToken: (token: string) => api.post('/notifications/push-token', { token }),
};

export const adminFlowApi = {
    getAll: (params: { businessId: string; branchId?: string }) => {
        const q = new URLSearchParams();
        q.set('businessId', params.businessId);
        if (params.branchId) q.set('branchId', params.branchId);
        return api.get(`/messaging/flows?${q.toString()}`);
    },
    create: (data: {
        businessId: string;
        branchId?: string;
        name: string;
        triggerType: 'new_visitor' | 'manual' | 'tag_applied' | 'birthday' | 'loyalty_milestone';
        structure: { nodes: any[]; edges: any[] };
    }) => api.post('/messaging/flows', data),
    updateStatus: (id: string, status: 'draft' | 'active' | 'paused') =>
        api.post(`/messaging/flows/${id}/status`, { status }),
    updateTemplate: (id: string, data: any) => api.put(`/admin/flow-engine/templates/${id}`, data),
};

export const adminHealthApi = {
    getSystemHealth: () => api.get('/admin/system/health'),
    getPublicHealth: () => api.get('/health'),
};

// =====================
// FLOW ENGINE (Admin)
// =====================
export const adminFlowEngineApi = {
    getAnalytics: (params?: {
        businessId?: string;
        branchId?: string;
        from?: string;
        to?: string;
        limit?: number;
    }) => {
        const q = new URLSearchParams();
        if (params?.businessId) q.set('businessId', params.businessId);
        if (params?.branchId) q.set('branchId', params.branchId);
        if (params?.from) q.set('from', params.from);
        if (params?.to) q.set('to', params.to);
        if (params?.limit !== undefined) q.set('limit', String(params.limit));
        return api.get(`/admin/flow-engine/analytics?${q.toString()}`);
    },
    getTemplates: () => api.get('/admin/flow-engine/templates'),
    getTriggers: () => api.get('/admin/flow-engine/triggers'),
    getSessions: (params?: { businessId?: string; branchId?: string; from?: string; to?: string; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.businessId) q.set('businessId', params.businessId);
        if (params?.branchId) q.set('branchId', params.branchId);
        if (params?.from) q.set('from', params.from);
        if (params?.to) q.set('to', params.to);
        if (params?.limit !== undefined) q.set('limit', String(params.limit));
        return api.get(`/admin/flow-engine/sessions?${q.toString()}`);
    },
    getLogs: (params?: { businessId?: string; branchId?: string; from?: string; to?: string; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.businessId) q.set('businessId', params.businessId);
        if (params?.branchId) q.set('branchId', params.branchId);
        if (params?.from) q.set('from', params.from);
        if (params?.to) q.set('to', params.to);
        if (params?.limit !== undefined) q.set('limit', String(params.limit));
        return api.get(`/admin/flow-engine/logs?${q.toString()}`);
    },
    getSettings: () => api.get('/admin/flow-engine/settings'),
    updateSettings: (data: any) => api.put('/admin/flow-engine/settings', data),
    updateTrigger: (key: string, data: any) => api.put(`/admin/flow-engine/triggers/${key}`, data),
    createTemplate: (data: {
        name: string;
        description?: string;
        triggerType: string;
        version?: string;
        status?: string;
        structure: { nodes: any[]; edges: any[] };
    }) => api.post('/admin/flow-engine/templates', data),
    deleteTemplate: (id: string) => api.delete(`/admin/flow-engine/templates/${id}`),
};

export const adminAgentsApi = {
    getAll: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        return api.get(`/agent/all?${q.toString()}`);
    }
};

export const adminCreditsApi = {
    getBusinessBalance: (businessId: string) => api.get(`/credits/business/${businessId}`),
    adjustCredits: (data: {
        businessId: string;
        channel: 'SMS' | 'WHATSAPP' | 'EMAIL';
        amount: number;
        action: 'add' | 'remove';
    }) => api.post('/credits/adjust', data),
};

// =====================
// LOYALTY (Admin)
// =====================
export const adminLoyaltyApi = {
    getTemplates: () => api.get('/loyalty/reward-templates'),
    createTemplate: (data: any) => api.post('/loyalty/reward-templates', data),
    getBusinessLogs: (params: { businessId: string; branchId?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        q.set('businessId', params.businessId);
        if (params.branchId) q.set('branchId', params.branchId);
        if (params.page) q.set('page', String(params.page));
        if (params.limit) q.set('limit', String(params.limit));
        return api.get(`/loyalty/points/business-logs?${q.toString()}`);
    },
};

// =====================
// CREDIT PLANS (Admin)
// =====================
export const adminCreditPlansApi = {
    create: (data: any) => api.post('/credit-plans', data),
    update: (id: string, data: any) => api.patch(`/credit-plans/${id}`, data),
    delete: (id: string) => api.delete(`/credit-plans/${id}`),
};
