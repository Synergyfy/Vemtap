export enum AddOnType {
    RESOURCE = 'RESOURCE',
    SERVICE = 'SERVICE',
}

export interface ServiceDetails {
    agentType?: string;
    description?: string;
    deliverables?: string[];
}

export interface AddOn {
    id: string;
    name: string;
    description: string | null;
    type: AddOnType;
    price: number;
    durationDays: number;
    currency: string;
    isActive: boolean;
    targetCapability: string | null;
    additionalLimit: number | null;
    serviceDetails: ServiceDetails | null;
    isOneTime: boolean;
    isRecurring: boolean;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AddOnStats {
    totalAddons: number;
    activeAddons: number;
    resourceAddons: number;
    serviceAddons: number;
    totalPurchases: number;
    activePurchases: number;
}

export interface CreateAddOnDto {
    name: string;
    description?: string;
    type: AddOnType;
    price: number;
    durationDays?: number;
    currency?: string;
    isActive?: boolean;
    targetCapability?: string;
    additionalLimit?: number;
    serviceDetails?: ServiceDetails;
    isOneTime?: boolean;
    isRecurring?: boolean;
    imageUrl?: string;
}

export type UpdateAddOnDto = Partial<CreateAddOnDto>;
