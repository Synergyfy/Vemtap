import { api } from '../api';

export const usersApi = {
    getMe: () => api.get('/users/profile'),
    updateMe: (data: any) => api.patch('/users/profile', data),
    updateEngagement: (engagement: any) => api.patch('/users/profile', { engagement }),
    // Note: Account deletion not yet supported by backend (GET/PATCH only)
};
