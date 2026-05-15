import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminSystemSettingsApi } from '@/lib/api/admin';
import { notify } from '@/lib/notify';

export const useAdminSettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings'],
        queryFn: adminSystemSettingsApi.get,
    });
};

export const useUpdateAdminSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: adminSystemSettingsApi.update,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
            notify.success('System settings updated successfully');
        },
        onError: (error: any) => {
            notify.error(error?.response?.data?.message || 'Failed to update system settings');
        },
    });
};
