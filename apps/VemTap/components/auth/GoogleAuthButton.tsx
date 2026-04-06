'use client';

import React from 'react';
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
            {/* Custom Styled Professional Button */}
            <div className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] active:scale-[0.98] cursor-pointer overflow-hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-[14px] font-bold text-[#3c4043] font-sans">
                    {isLoading ? 'Connecting...' : label}
                </span>
            </div>

            {/* Hidden Functional Google Component (The "Ghost") */}
            <div className="absolute inset-0 opacity-0 cursor-pointer overflow-hidden rounded-xl">
                <GoogleLogin
                    onSuccess={onSuccess}
                    onError={() => toast.error('Google Login Failed')}
                    useOneTap
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="400px" // Oversize to ensure it covers the button
                />
            </div>

            {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
                    <Spinner size="sm" />
                </div>
            )}
        </div>
    );
};
