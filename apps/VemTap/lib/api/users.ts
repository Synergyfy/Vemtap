import { api } from '../api';

export const usersApi = {
    getMe: () => api.get('/users/me'),
    updateMe: (data: any) => api.patch('/users/me', data),
    deleteMe: () => api.delete('/users/me'),
};
