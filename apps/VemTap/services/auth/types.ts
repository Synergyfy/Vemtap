export interface RegisterOwnerRequest {
    firstName: string;
    lastName: string;
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
}

export interface AuthResponse {
    user: any; // We can type this better later
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}
