import { api } from '../api';

export const usersApi = {
    getMe: () => api.get('/users/profile'),
    updateMe: (data: any) => api.patch('/users/profile', data),
    updateEngagement: (engagement: any) => api.patch('/users/profile', { engagement }),
    deleteMe: () => api.delete('/users/profile'),
};
