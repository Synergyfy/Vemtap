import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StaffMember, InviteStaffRequest, UpdateStaffRequest } from './types';
import { useAuthStore } from '@/store/useAuthStore';

export const useStaff = (branchId?: string) => {
    const userBusinessId = useAuthStore((state) => state.user?.businessId);

    return useQuery<StaffMember[], Error>({
        queryKey: ['staff', branchId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (branchId) params.append('branchId', branchId);
            return await api.get(`/users/staff?${params.toString()}`);
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
