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
    disable: (id: string) => api.delete(`/users/admin/${id}`),
    resetPassword: (email: string) => api.post(`/users/admin/reset-password-link/${email}`, {}),
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
    update: (id: string, data: any) => api.patch(`/businesses/${id}`, data),
    getStats: (id: string) => api.get(`/businesses/admin/${id}/stats`),
};

// =====================
// DEVICES (Admin)
// =====================
export const adminDevicesApi = {
    getAll: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.status) q.set('status', params.status);
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
    getAll: () => api.get('/subscriptions/admin'),
    getStats: () => api.get('/subscriptions/admin/stats'),
};

// =====================
// ANALYTICS (Admin)
// =====================
export const adminAnalyticsApi = {
    getAdminSummary: () => api.get('/analytics/admin/summary'),
};

export const adminSupportApi = {
    getAllTickets: () => api.get('/support/admin/tickets'),
    getTicketDetails: (id: string) => api.get(`/support/admin/tickets/${id}`),
    updateTicketStatus: (id: string, status: 'Open' | 'In Progress' | 'Closed') =>
        api.post(`/support/admin/tickets/${id}/status`, { status }),
    replyToTicket: (id: string, message: string) => api.post(`/support/admin/tickets/${id}/message`, { message }),
    resolveTicket: (id: string) => adminSupportApi.updateTicketStatus(id, 'Closed'),
};

export const adminMessagingApi = {
    getAllTemplates: () => api.get('/messaging/admin/templates'),
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
};

export const adminHealthApi = {
    getSystemHealth: () => api.get('/admin/system/health'),
};
