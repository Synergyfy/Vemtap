import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AddOn, AddOnStats, CreateAddOnDto, UpdateAddOnDto } from './types';
import { notify } from '@/lib/notify';

export const useAdminAddOns = () => {
    return useQuery<AddOn[], Error>({
        queryKey: ['admin', 'addons'],
        queryFn: async () => {
            return await api.get('/addons/admin');
        },
    });
};

export const useAddOns = () => {
    return useQuery<AddOn[], Error>({
        queryKey: ['addons', 'list'],
        queryFn: async () => {
            return await api.get('/addons');
        },
    });
};

export const useMyActiveAddOns = () => {
    return useQuery<any[], Error>({
        queryKey: ['addons', 'my', 'active'],
        queryFn: async () => {
            return await api.get('/addons/my/active');
        },
    });
};

export const usePurchaseAddOn = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { addonIds: string[]; paymentReference?: string; quantities?: number[] }>({
        mutationFn: async (dto) => await api.post('/addons/purchase', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['subscription', 'capabilities'] });
            notify.success('Add-on purchased successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to purchase add-on');
        }
    });
};

export const useAddOnStats = () => {
    return useQuery<AddOnStats, Error>({
        queryKey: ['admin', 'addons', 'stats'],
        queryFn: async () => {
            return await api.get('/addons/admin/stats');
        },
    });
};

export const useAddAddOn = () => {
    const queryClient = useQueryClient();
    return useMutation<AddOn, Error, CreateAddOnDto>({
        mutationFn: async (dto) => await api.post('/addons/admin', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons', 'stats'] });
            notify.success('Add-on created successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to create add-on');
        }
    });
};

export const useUpdateAddOn = () => {
    const queryClient = useQueryClient();
    return useMutation<AddOn, Error, { id: string; data: UpdateAddOnDto }>({
        mutationFn: async ({ id, data }) => await api.patch(`/addons/admin/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons', 'stats'] });
            notify.success('Add-on updated successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to update add-on');
        }
    });
};

export const useDeleteAddOn = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/addons/admin/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'addons', 'stats'] });
            notify.success('Add-on deactivated successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to deactivate add-on');
        }
    });
};
