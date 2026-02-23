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
    getLoyaltyStats: () => api.get('/analytics/admin/loyalty/stats'),
};
