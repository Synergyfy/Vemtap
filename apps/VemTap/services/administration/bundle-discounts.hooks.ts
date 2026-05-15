import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminBundleDiscountsApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';

export const useAdminBundleDiscounts = () => {
    return useQuery({
        queryKey: ['admin', 'bundle-discounts'],
        queryFn: async () => {
            const res = await adminBundleDiscountsApi.getAll();
            return res;
        },
    });
};

export const useAddBundleDiscount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminBundleDiscountsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-discounts'] });
            notify.success('Bundle discount created successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to create bundle discount');
        },
    });
};

export const useUpdateBundleDiscount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminBundleDiscountsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-discounts'] });
            notify.success('Bundle discount updated successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to update bundle discount');
        },
    });
};

export const useDeleteBundleDiscount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminBundleDiscountsApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'bundle-discounts'] });
            notify.success('Bundle discount deleted successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to delete bundle discount');
        },
    });
};
