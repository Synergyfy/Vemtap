export interface Branch {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    businessId: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateBranchRequest {
    name: string;
    address?: string;
    phone?: string;
}

export interface UpdateBranchRequest {
    name?: string;
    address?: string;
    phone?: string;
}
