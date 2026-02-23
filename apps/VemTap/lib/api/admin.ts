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
    replyToTicket: (id: string, message: string) => api.post(`/support/admin/tickets/${id}/message`, { message }),
    resolveTicket: (id: string) => api.post(`/support/admin/tickets/${id}/status`, { status: 'Closed' }),
};

export const adminMessagingApi = {
    getAllTemplates: () => api.get('/messaging/admin/templates'),
    updateTemplateStatus: (id: string, status: string) => api.post(`/messaging/admin/templates/${id}/status`, { status }),
};
