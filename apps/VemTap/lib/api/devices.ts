import { api } from '../api';

export interface Device {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'inactive';
    location?: string;
    totalScans: number;
    type: string;
    batteryLevel: number;
    lastActive?: string;
    businessId: string;
    business?: any; // Added to support tap flow metadata
    orderId?: string;
    branchId?: string;
    branch?: any; // Added to support tap flow metadata
    productTypeId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeviceStats {
    totalDevices: number;
    activeNow: number;
    totalScans: number;
    offline: number;
}

export const fetchDevices = async (): Promise<Device[]> => {
    return await api.get('/devices');
};

export const fetchDeviceStats = async (): Promise<DeviceStats> => {
    return await api.get('/devices/stats');
};

export const fetchDeviceDetail = async (id: string): Promise<Device> => {
    return await api.get(`/devices/${id}`);
};

export const generateDevices = async (): Promise<Device[]> => {
    return await api.post('/devices/generate', {});
};

export const updateDeviceNames = async (assets: { id: string; name: string }[]): Promise<Device[]> => {
    return await api.patch('/devices/names', { assets });
};

export const updateDevice = async (id: string, data: Partial<Device>): Promise<Device> => {
    return await api.patch(`/devices/${id}`, data);
};

export const deleteDevice = async (id: string): Promise<void> => {
    return await api.delete(`/devices/${id}`);
};

export const createDevice = async (data: any): Promise<Device> => {
    return await api.post('/devices', data);
};

export const fetchDeviceByCode = async (code: string): Promise<Device> => {
    return await api.get(`/loyalty/device-info/${code}`);
};
