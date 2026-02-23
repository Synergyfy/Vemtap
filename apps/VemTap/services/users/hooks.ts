import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StaffMember, InviteStaffRequest, UpdateStaffRequest } from './types';
import { useAuthStore, AuthState } from '../../store/useAuthStore';

export const useStaff = (branchId?: string) => {
    const userBusinessId = useAuthStore((state: AuthState) => state.user?.businessId);

    return useQuery<StaffMember[], Error>({
        queryKey: ['staff', branchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (branchId && branchId !== 'all') {
                params.append('branchId', branchId);
            }
            return await api.get(`/users/staff${params.toString() ? `?${params.toString()}` : ''}`);
        },
        enabled: !!userBusinessId,
    });
};

export const useInviteStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffMember, Error, InviteStaffRequest>({
        mutationFn: async (dto) => await api.post('/users/staff/invite', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffMember, Error, { id: string; updates: UpdateStaffRequest }>({
        mutationFn: async ({ id, updates }) => await api.patch(`/users/staff/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

export const useRemoveStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/users/staff/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};
// --- Admin Hooks ---

export const useAdminUsers = (query?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    return useQuery<any, Error>({
        queryKey: ['admin-users', query],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query?.search) params.append('search', query.search);
            if (query?.role) params.append('role', query.role);
            if (query?.status) params.append('status', query.status);
            if (query?.page) params.append('page', query.page.toString());
            if (query?.limit) params.append('limit', query.limit.toString());
            return await api.get(`/users/admin?${params.toString()}`);
        },
    });
};

export const useAdminCreateUser = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, any>({
        mutationFn: async (dto) => await api.post('/users/admin', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};

export const useAdminUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, { id: string; updates: any }>({
        mutationFn: async ({ id, updates }) => await api.patch(`/users/admin/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};

export const useAdminDeleteUser = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => await api.delete(`/users/admin/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};
