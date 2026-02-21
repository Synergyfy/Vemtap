export interface Device {
    id: string;
    name: string;
    code: string;
    status: 'active' | 'inactive';
    location: string;
    totalScans: number;
    type: string;
    batteryLevel: number;
    lastActive: string | null;
    businessId: string;
    orderId: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDeviceRequest {
    name: string;
    location?: string;
    code?: string; // Sometimes generated, sometimes provided
}

export interface UpdateDeviceRequest {
    name?: string;
    location?: string;
    status?: 'active' | 'inactive';
}
