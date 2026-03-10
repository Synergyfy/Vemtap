import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Device, CreateDeviceRequest, UpdateDeviceRequest } from './types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';

export const useDevices = (branchId?: string) => {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const user = useAuthStore((state) => state.user);
    const businessId = user?.businessId;
    const resolvedBranchId = branchId || urlBranchId;

    return useQuery<Device[], Error>({
        queryKey: ['devices', businessId, resolvedBranchId, isAllBranches],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) {
                searchParams.append('branchId', resolvedBranchId);
            } else if (isAllBranches || !resolvedBranchId) {
                searchParams.append('allBranches', 'true');
            }
            const query = searchParams.toString();
            return await api.get(`/devices${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId
    });
};

export const useDeviceStats = (branchId?: string) => {
    const { activeBranchId: urlBranchId, isAllBranches } = useActiveBranch();
    const user = useAuthStore((state) => state.user);
    const businessId = user?.businessId;
    const resolvedBranchId = branchId || urlBranchId;

    return useQuery<any, Error>({
        queryKey: ['devices', 'stats', businessId, resolvedBranchId, isAllBranches],
        queryFn: async () => {
            const searchParams = new URLSearchParams();
            if (resolvedBranchId) {
                searchParams.append('branchId', resolvedBranchId);
            } else if (isAllBranches || !resolvedBranchId) {
                searchParams.append('allBranches', 'true');
            }
            const query = searchParams.toString();
            return await api.get(`/devices/stats${query ? `?${query}` : ''}`);
        },
        enabled: !!businessId
    });
};

export const useDevice = (id: string) => {
    return useQuery<Device, Error>({
        queryKey: ['device', id],
        queryFn: async () => {
            return await api.get(`/devices/${id}`);
        },
        enabled: !!id,
    });
};

export const useAddDevice = () => {
    const queryClient = useQueryClient();
    return useMutation<Device, Error, CreateDeviceRequest>({
        mutationFn: async (data) => {
            return await api.post('/devices', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        },
    });
};

export const useUpdateDevice = () => {
    const queryClient = useQueryClient();
    return useMutation<Device, Error, { id: string; updates: UpdateDeviceRequest }>({
        mutationFn: async ({ id, updates }) => {
            return await api.patch(`/devices/${id}`, updates);
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
            queryClient.invalidateQueries({ queryKey: ['device', variables.id] });
        },
    });
};

export const useDeleteDevice = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, string>({
        mutationFn: async (id) => {
            return await api.delete(`/devices/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['devices'] });
        },
    });
};
