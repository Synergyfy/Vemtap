import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Business } from './types';

export const useMyBusiness = () => {
    return useQuery<Business, Error>({
        queryKey: ['my-business'],
        queryFn: async () => {
            const data = await api.get('/businesses/my-business');
            return data;
        },
    });
};
