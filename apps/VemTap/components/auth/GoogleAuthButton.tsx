'use client';

import React, { useState } from 'react';
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
    const [isPrompting, setIsPrompting] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // credentialResponse.credential is the ID Token from Google Identity Services
        if (!credentialResponse?.credential) {
            toast.error('Google authentication failed — no credential received');
            return;
        }
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
        }
    };

    const handleClick = () => {
        // Use Google Identity Services directly — avoids the opacity-0 iframe
        // clickjacking-protection issue in modern browsers on production HTTPS.
        const google = (window as any).google;
        if (!google?.accounts?.id) {
            toast.error('Google Sign-In is not available. Please refresh the page.');
            return;
        }

        setIsPrompting(true);

        google.accounts.id.cancel(); // cancel any stale prompt
        google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: (response: any) => {
                setIsPrompting(false);
                handleGoogleSuccess(response);
            },
            auto_select: false,
            cancel_on_tap_outside: true,
        });

        google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                setIsPrompting(false);
                const reason =
                    notification.getNotDisplayedReason?.() ||
                    notification.getSkippedReason?.() ||
                    'unknown';
                console.warn('[GoogleAuth] Prompt not displayed:', reason);
                // One-Tap was suppressed (e.g. user dismissed it too many times).
                // Surface a friendly message rather than silently failing.
                toast.error('Google sign-in prompt was blocked. Please try again or clear browser cookies.');
            }
        });
    };

    const loading = isLoading || isPrompting;

    return (
        <div className={`w-full ${className}`}>
            <button
                type="button"
                onClick={handleClick}
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-3 bg-white hover:bg-slate-50 transition-all duration-300 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden"
            >
                {loading ? (
                    <Spinner size="sm" />
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="text-[13px] font-bold text-[#3c4043] font-sans">
                            {label}
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};
