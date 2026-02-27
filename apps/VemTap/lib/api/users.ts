import { api } from '../api';

export const usersApi = {
    getMe: () => api.get('/users/me'),
    updateMe: (data: any) => api.patch('/users/me', data),
    updateEngagement: (engagement: any) => api.patch('/users/me/engagement', { engagement }),
    deleteMe: () => api.delete('/users/me'),
};
