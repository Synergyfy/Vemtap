import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export const useUpdateBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation<Business, Error, { id: string; updates: Partial<Business> }>({
        mutationFn: async ({ id, updates }) => {
            return await api.patch(`/businesses/${id}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-business'] });
        },
    });
};
