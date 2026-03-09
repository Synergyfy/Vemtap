export interface RequestOwnerOtpRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'Owner';
}

export interface RegisterOwnerRequest {
    email: string;
    password: string;
    businessName: string;
    businessLogo?: string;
    category?: string;
    visitors?: string;
    goals?: string[];
    whatsappNumber?: string;
    officialEmail?: string;
    businessNumber?: string;
    businessAddress?: string;
    businessWebsite?: string;
    isRegistered?: boolean;
    registrationNumber?: string;
    state?: string;
    city?: string;
    verificationDoc?: string;
}

export interface AuthResponse {
    user: any; // We can type this better later
    access_token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string; // 'Owner' | 'Manager' | 'Staff' | 'Customer'
    phone?: string;
    businessName?: string;
    category?: string;
    monthlyVisitors?: string;
    goal?: string;
    businessId?: string; // For joining an existing business (Manager flow)
}
