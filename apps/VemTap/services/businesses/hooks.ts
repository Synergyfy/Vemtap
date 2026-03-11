import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Business } from './types';

export const useMyBusiness = (enabled = true) => {
    return useQuery<Business, Error>({
        queryKey: ['my-business'],
        queryFn: async () => {
            const data = await api.get('/businesses/my-business');
            return data;
        },
        enabled,
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
