import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Device, CreateDeviceRequest, UpdateDeviceRequest } from './types';
import toast from 'react-hot-toast';

export const useDevices = () => {
    return useQuery<Device[], Error>({
        queryKey: ['devices'],
        queryFn: async () => {
            return await api.get('/devices');
        }
    });
};

export const useDeviceStats = () => {
    return useQuery<any, Error>({
        queryKey: ['devices', 'stats'],
        queryFn: async () => {
            return await api.get('/devices/stats');
        }
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
