import { useState } from 'react';
import { api } from '@/lib/api';
import { RegisterOwnerRequest, AuthResponse, LoginRequest, RegisterRequest, RequestOwnerOtpRequest, ChangePasswordRequest, TwoFactorSetupResponse } from './types';

export const useRegisterOwner = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registerOwner = async (payload: RegisterOwnerRequest): Promise<AuthResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register/owner', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to register owner';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const requestOwnerOtp = async (payload: RequestOwnerOtpRequest): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register/owner/request-otp', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to request registration OTP';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        registerOwner,
        requestOwnerOtp,
        isLoading,
        error
    };
};

export const useOtp = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendOtp = async (payload: { email: string }): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/otp/send', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send OTP';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (payload: { email: string; code: string }): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/otp/verify', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Invalid OTP';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        sendOtp,
        verifyOtp,
        isLoading,
        error
    };
};

export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loginUser = async (payload: LoginRequest): Promise<AuthResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to login';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        loginUser,
        isLoading,
        error
    };
};

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registerUser = async (payload: RegisterRequest): Promise<AuthResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/register', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to register';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        registerUser,
        isLoading,
        error
    };
};

export const useChangePassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const changePassword = async (payload: any): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/change-password', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to change password';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        changePassword,
        isLoading,
        error
    };
};

export const useCheckUserStatus = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkStatus = async (identifier: string): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/check-status', { identifier });
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to check status';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { checkStatus, isLoading, error };
};

export const useCompleteCustomerSetup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const completeSetup = async (payload: { identifier: string; email: string }): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/customer/complete-setup', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to complete setup';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { completeSetup, isLoading, error };
};

export const useResendDefaultPassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resendPassword = async (identifier: string): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/resend-default-password', { identifier });
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to resend password';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { resendPassword, isLoading, error };
};

export const useGoogleLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const googleLogin = async (payload: { token: string; role?: string }): Promise<AuthResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/google', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Google authentication failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { googleLogin, isLoading, error };
};

// --- Email Verification ---

export const useSendEmailVerification = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendVerification = async (): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/email-verification/send', {});
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to send verification email';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { sendVerification, isLoading, error };
};

export const useVerifyEmail = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const verifyEmail = async (payload: { email: string; code: string }): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/email-verification/verify', payload);
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Invalid verification code';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { verifyEmail, isLoading, error };
};

// --- Two-Factor Authentication ---

export const useSetup2FA = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setup = async (): Promise<TwoFactorSetupResponse> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/2fa/setup', {});
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to set up 2FA';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { setup, isLoading, error };
};

export const useConfirm2FA = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = async (code: string): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/2fa/confirm', { code });
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Invalid 2FA code';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { confirm, isLoading, error };
};

export const useDisable2FA = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const disable = async (code: string): Promise<any> => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/2fa/disable', { code });
            return response;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to disable 2FA';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { disable, isLoading, error };
};

