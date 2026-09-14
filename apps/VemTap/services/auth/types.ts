export interface RequestOwnerOtpRequest {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    role: 'Owner';
}

export interface RegisterOwnerRequest {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    businessLogo?: string;
    categoryId?: string;
    subcategoryId?: string;
    otherSubcategoryName?: string;
    visitors?: string;
    goals?: string[];
    whatsappNumber?: string;
    officialEmail?: string;
    businessNumber?: string;
    businessAddress?: string;
    businessWebsite?: string;
    state?: string;
    city?: string;
    isRegistered?: boolean;
    referralCode?: string;
}

import { User } from '../../store/useAuthStore';

export interface AuthResponse {
    user: User;
    access_token: string;
    isNewUser?: boolean;
}

export interface LoginRequest {
    identifier: string;
    password: string;
    twoFactorCode?: string;
}

export interface CustomerRegisterRequestOtpRequest {
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    branchId?: string;
}

export interface CustomerResendRegistrationOtpRequest {
    email: string;
}

export interface CustomerRegisterVerifyAndSetPinRequest {
    email: string;
    code: string;
    pin: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    branchId?: string;
}

export interface ForgotPinRequest {
    email: string;
}

export interface ResetPinRequest {
    email: string;
    otp: string;
    newPin: string;
}

export interface TwoFactorSetupResponse {
    secret: string;
    otpauthUrl: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    role?: string; // 'Owner' | 'Manager' | 'Staff' | 'Customer'
    phone?: string;
    businessName?: string;
    category?: string;
    monthlyVisitors?: string;
    goal?: string;
    businessId?: string; // For joining an existing business (Manager flow)
    referralCode?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}
