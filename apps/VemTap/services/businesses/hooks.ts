import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Business } from './types';

import { useAuthStore } from '@/store/useAuthStore';

export const useMyBusiness = (enabled = true) => {
    const { user } = useAuthStore();
    const isCustomer = user?.role?.toLowerCase() === 'customer';

    return useQuery<Business, Error>({
        queryKey: ['my-business'],
        queryFn: async () => {
            const data = await api.get('/businesses/my-business');
            return data;
        },
        enabled: enabled && !isCustomer,
    });
};

export const useUpdateBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation<Business, Error, { id?: string; updates: any }>({
        mutationFn: async ({ updates }) => {
            return await api.patch('/businesses/my-business', updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-business'] });
        },
    });
};
