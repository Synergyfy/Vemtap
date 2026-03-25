import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StaffMember, InviteStaffRequest, UpdateStaffRequest, AdminUser, AdminUsersResponse } from './types';
import { useAuthStore, AuthState } from '../../store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export const useStaff = (branchId?: string, allBranches?: boolean) => {
    const { activeBranchId: urlBranchId } = useActiveBranch();
    const userBusinessId = useAuthStore((state: AuthState) => state.user?.businessId);
    const resolvedBranchId = branchId || urlBranchId;

    return useQuery<StaffMember[], Error>({
        queryKey: ['staff', userBusinessId, resolvedBranchId, allBranches],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (resolvedBranchId && !allBranches) {
                params.append('branchId', resolvedBranchId);
            }
            if (allBranches) {
                params.append('allBranches', 'true');
            }
            const data = await api.get(`/users/team?${params.toString()}`);
            if (!Array.isArray(data)) return [];
            return data.map(item => ({
                ...item,
                id: item.id || item.uniqueCode || item.email
            }));
        },
        enabled: !!userBusinessId,
    });
};
export const useInviteStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffMember, Error, InviteStaffRequest>({
        mutationFn: async (dto) => await api.post('/users/team/invite', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

export const useUpdateStaff = () => {
    const queryClient = useQueryClient();

    return useMutation<StaffMember, Error, { id: string; updates: UpdateStaffRequest; branchId?: string }>({
        mutationFn: async ({ id, updates, branchId }) => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            return await api.patch(`/users/team/${id}?${params.toString()}`, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

export const useRemoveStaff = (branchId?: string) => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            return await api.delete(`/users/team/${id}?${params.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });
};

export const useUpdateSocials = () => {
    const queryClient = useQueryClient();
    return useMutation<any, Error, any>({
        mutationFn: async (engagement) => await api.patch('/users/engagement', { engagement }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-business'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        },
    });
};

// --- Admin Hooks ---

export const useUserProfile = () => {
    return useQuery<any, Error>({
        queryKey: ['user-profile'],
        queryFn: async () => await api.get('/users/profile'),
    });
};

export const useAdminUsers = (query?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    return useQuery<AdminUsersResponse, Error>({
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
    return useMutation<AdminUser, Error, any>({
        mutationFn: async (dto) => await api.post('/users/admin', dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};

export const useAdminUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation<AdminUser, Error, { id: string; updates: any }>({
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
