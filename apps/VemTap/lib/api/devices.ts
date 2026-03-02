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
    business?: BusinessData;
    orderId?: string;
    branchId?: string;
    branch?: any;
    owner?: any;
    productTypeId?: string;
    isFirstTimeVisit?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BusinessData {
    id: string;
    name: string;
    type?: string;
    category?: string;
    logoUrl?: string;
    welcomeMessage?: string;
    welcomeTitle?: string;
    welcomeSubMessage?: string;
    successMessage?: string;
    privacyMessage?: string;
    rewardMessage?: string;
    about?: string;
    businessHours?: {
        monday?: { open: string; close: string; closed: boolean };
        tuesday?: { open: string; close: string; closed: boolean };
        wednesday?: { open: string; close: string; closed: boolean };
        thursday?: { open: string; close: string; closed: boolean };
        friday?: { open: string; close: string; closed: boolean };
        saturday?: { open: string; close: string; closed: boolean };
        sunday?: { open: string; close: string; closed: boolean };
    };
    rewardEnabled?: boolean;
    rewardVisitThreshold?: number;
    address?: string;
    website?: string;
    whatsappNumber?: string;
    officialEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    customLink?: string;
    linkedinUrl?: string;
    reviewUrl?: string;
    showReview?: boolean;
    showSocial?: boolean;
    showFeedback?: boolean;
    monthlyVisitors?: string;
    goal?: string;
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
