'use client';

import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLogin as useBackendGoogleLogin } from '@/services/auth/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import Spinner from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { AuthResponse } from '@/services/auth/types';

interface GoogleAuthButtonProps {
    role?: 'customer' | 'owner';
    onSuccess?: (data: AuthResponse) => void;
    label?: string;
    className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
    role = 'customer',
    onSuccess,
    className = ""
}) => {
    const { googleLogin, isLoading } = useBackendGoogleLogin();
    const { login } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse?.credential) {
            toast.error('Google authentication failed — no credential received');
            return;
        }
        setIsProcessing(true);
        try {
            const res = await googleLogin({
                token: credentialResponse.credential,
                role
            });

            login(res.user, res.access_token);
            toast.success('Successfully authenticated with Google');

            if (onSuccess) {
                onSuccess(res);
            }
        } catch (err: any) {
            toast.error(err.message || 'Google authentication failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const loading = isLoading || isProcessing;

    return (
        <div className={`w-full flex justify-center items-center ${className}`}>
            {loading ? (
                <div className="w-full h-11 flex items-center justify-center bg-white rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)]">
                    <Spinner size="sm" />
                </div>
            ) : (
                <div className="w-full flex justify-center overflow-hidden rounded-xl">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => {
                            toast.error('Google Sign-In failed or was cancelled');
                        }}
                        useOneTap={false}
                        theme="outline"
                        shape="rectangular"
                        width="100%"
                        text="continue_with"
                    />
                </div>
            )}
        </div>
    );
};

