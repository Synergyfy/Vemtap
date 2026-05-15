import { api } from '@/lib/api';

export const bannersApi = {
    getActive: () => api.get('/banners'),
};
