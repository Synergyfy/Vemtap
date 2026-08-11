import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Business } from './types';

import { useAuthStore } from '@/store/useAuthStore';

export const useMyBusiness = (enabled = true) => {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.access_token);
    const isCustomer = user?.role?.toLowerCase() === 'customer';

    return useQuery<Business, Error>({
        // Scope the key to the current business AND the session token so a stale
        // cache entry from a previous account can never be served on a different
        // account, even across a client-side (no page reload) account switch.
        queryKey: ['my-business', user?.businessId ?? user?.id, token ?? 'anon'],
        queryFn: async () => {
            const data = await api.get('/businesses/my-business');
            return data;
        },
        enabled: enabled && !!user && !isCustomer,
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
