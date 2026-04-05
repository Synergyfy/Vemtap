'use client';

import React from 'react';
import { useGoogleLogin as useGoogleOAuth } from '@react-oauth/google';
import { useGoogleLogin } from '@/services/auth/hooks';
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
    label = 'Continue with Google',
    className = ""
}) => {
    const { googleLogin, isLoading } = useGoogleLogin();
    const { login } = useAuthStore();

    const handleGoogleSuccess = async (tokenResponse: any) => {
        try {
            // tokenResponse.credential contains the ID Token
            const res = await googleLogin({ 
                token: tokenResponse.credential, 
                role 
            });
            
            login(res.user, res.access_token);
            toast.success('Successfully authenticated with Google');
            
            if (onSuccess) {
                onSuccess(res);
            }
        } catch (err: any) {
            toast.error(err.message || 'Google authentication failed');
        }
    };

    // Note: We use the built-in Google Login button for better security and brand compliance
    // but we can also use a custom one with useGoogleLogin hook from @react-oauth/google
    // For this implementation, we'll use a custom styled button for better UI integration
    
    return (
        <div className={`w-full ${className}`}>
            <button
                type="button"
                onClick={() => {
                    // This is handled by the GoogleLogin component or useGoogleLogin hook
                    // However, @react-oauth/google's GoogleLogin is the easiest way to get the ID Token
                }}
                className="hidden"
                id="google-login-hidden-trigger"
            />
            {/* We'll use the official Google button script-based approach or the component */}
            {/* For now, let's use the standard component for simplicity and compliance */}
            <div className="flex justify-center w-full">
                <GoogleLoginWrapper 
                    onSuccess={handleGoogleSuccess} 
                    label={label}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

// Internal wrapper to manage the script-based Google button
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginWrapper = ({ onSuccess, label, isLoading }: any) => {
    return (
        <div className="w-full relative group">
            {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
                    <Spinner size="sm" />
                </div>
            )}
            <div className="w-full h-[44px] flex items-center justify-center border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-all">
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={() => toast.error('Google Login Failed')}
                    useOneTap
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="100%"
                    text="signin_with"
                />
            </div>
        </div>
    );
};
