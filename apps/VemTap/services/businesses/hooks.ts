import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Business } from './types';

import { useAuthStore } from '@/store/useAuthStore';

export const useMyBusiness = (businessId?: string, enabled = true) => {
    const { user } = useAuthStore();
    const isCustomer = user?.role?.toLowerCase() === 'customer';

    return useQuery<Business, Error>({
        queryKey: ['my-business', businessId],
        queryFn: async () => {
            const endpoint = (businessId && businessId !== 'undefined') ? `/businesses/admin/${businessId}` : '/businesses/my-business';
            const data = await api.get(endpoint);
            return data?.data || data; 
        },
        enabled: enabled && !!user && !isCustomer,
    });
};

export const useUpdateBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation<Business, Error, { id?: string; updates: any; businessId?: string }>({
        mutationFn: async ({ updates, businessId }) => {
            const endpoint = (businessId && businessId !== 'undefined') ? `/businesses/${businessId}` : '/businesses/my-business';
            return await api.patch(endpoint, updates);
        },
        onSuccess: (_, { businessId }) => {
            queryClient.invalidateQueries({ queryKey: ['my-business', businessId] });
            queryClient.invalidateQueries({ queryKey: ['admin-business', businessId] });
        },
    });
};

export const useAdminBusiness = (id?: string) => {
    return useQuery<any, Error>({
        queryKey: ['admin-business', id],
        queryFn: async () => {
            const res = await api.get(`/businesses/admin/${id}`);
            return res?.data || res;
        },
        enabled: !!id,
    });
};
