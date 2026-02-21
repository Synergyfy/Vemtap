import { useState } from 'react';
import { api } from '@/lib/api';
import { RegisterOwnerRequest, AuthResponse, LoginRequest } from './types';

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

    return {
        registerOwner,
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
