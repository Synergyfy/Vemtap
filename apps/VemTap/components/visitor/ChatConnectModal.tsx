'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { presets } from './presets';
import { VisitorHeader } from './VisitorHeader';
import Spinner from '@/components/ui/Spinner';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { signupVisitorAndLogin } from '@/lib/visitorAuth';
import { useAuthStore } from '@/store/useAuthStore';

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email("Invalid email format").optional().or(z.literal('')),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

type SignupData = z.infer<typeof signupSchema>;
type LoginData = z.infer<typeof loginSchema>;

interface ChatConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    storeName: string;
    logoUrl?: string | null;
    /** Custom header title for sign-in mode */
    signInTitle?: string;
    /** Custom subtitle for sign-in mode */
    signInSubtitle?: string;
    /** Custom header title for sign-up mode */
    signUpTitle?: string;
    /** Custom subtitle for sign-up mode */
    signUpSubtitle?: string;
}

export const ChatConnectModal: React.FC<ChatConnectModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    storeName,
    logoUrl,
    signInTitle = 'Welcome Back',
    signInSubtitle = 'Sign in to continue to chat.',
    signUpTitle = 'Join Us',
    signUpSubtitle = 'Create an account to start chatting.',
}) => {
    const [mode, setMode] = useState<'signup' | 'signin'>('signin');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuthStore();

    const signupForm = useForm<SignupData>({
        resolver: zodResolver(signupSchema),
        defaultValues: { name: '', email: '', phone: '' },
        mode: 'onChange',
    });

    const loginForm = useForm<LoginData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
        mode: 'onChange',
    });

    const handleSignupSubmit = async (data: SignupData) => {
        setIsSubmitting(true);
        try {
            await signupVisitorAndLogin({ email: data.email, phone: data.phone, name: data.name });

            if (useAuthStore.getState().isAuthenticated) {
                toast.success('Account created successfully!');
                onSuccess();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Signup failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLoginSubmit = async (data: LoginData) => {
        setIsSubmitting(true);
        try {
            const authResponse = await api.post('/auth/login', {
                identifier: data.email,
                password: data.password,
            });

            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                toast.success('Welcome back!');
                onSuccess();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSuccess = async (res: any) => {
        if (res.access_token && res.user) {
            login(res.user, res.access_token);
            toast.success('Signed in with Google!');
            onSuccess();
        } else if (res.user?.email) {
            try {
                const authResponse = await api.post('/auth/login', {
                    identifier: res.user.email,
                    password: '123456',
                });
                if (authResponse?.access_token) {
                    login(authResponse.user, authResponse.access_token);
                    toast.success('Signed in with Google!');
                    onSuccess();
                }
            } catch (err: any) {
                toast.error('Google authentication failed');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            {/* Modal Card */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors z-10"
                >
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">close</span>
                </button>

                {/* Header */}
                <div className="border-b border-slate-100 bg-white">
                    <div className="p-6 pb-4">
                        <VisitorHeader logoUrl={logoUrl} storeName={storeName} />
                        <div className="mt-3">
                            <h1 className="text-lg font-bold text-slate-900 leading-tight mb-1">
                                {mode === 'signin' ? signInTitle : signUpTitle}
                            </h1>
                            <p className="text-xs font-medium text-slate-500">
                                {mode === 'signin' ? signInSubtitle : signUpSubtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 pt-4 overflow-y-auto max-h-[60vh]">
                    {/* Google Auth */}
                    <div className="mb-4">
                        <GoogleAuthButton
                            role="Customer"
                            onSuccess={handleGoogleSuccess}
                            className="h-11"
                        />
                    </div>

                    <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">or</span>
                        </div>
                    </div>

                    {/* Sign In Form */}
                    {mode === 'signin' && (
                        <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-3">
                            <div className="space-y-1">
                                <label className={presets.label}>Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                    </div>
                                    <input
                                        type="email"
                                        {...loginForm.register('email')}
                                        disabled={isSubmitting}
                                        placeholder="Enter your email"
                                        className={cn(
                                            presets.input,
                                            loginForm.formState.errors.email ? 'border-red-500' : ''
                                        )}
                                    />
                                </div>
                                {loginForm.formState.errors.email && (
                                    <p className={presets.error}>{loginForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={presets.label}>Password</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                    </div>
                                    <input
                                        type="password"
                                        {...loginForm.register('password')}
                                        disabled={isSubmitting}
                                        placeholder="Enter your password"
                                        className={cn(
                                            presets.input,
                                            loginForm.formState.errors.password ? 'border-red-500' : ''
                                        )}
                                    />
                                </div>
                                {loginForm.formState.errors.password && (
                                    <p className={presets.error}>{loginForm.formState.errors.password.message}</p>
                                )}
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={!loginForm.formState.isValid || isSubmitting}
                                    className={presets.button}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <span>Sign In</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Sign Up Form */}
                    {mode === 'signup' && (
                        <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-3">
                            <div className="space-y-1">
                                <label className={presets.label}>Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                    </div>
                                    <input
                                        type="text"
                                        {...signupForm.register('name')}
                                        disabled={isSubmitting}
                                        placeholder="Enter your full name"
                                        className={cn(
                                            presets.input,
                                            signupForm.formState.errors.name ? 'border-red-500' : ''
                                        )}
                                    />
                                </div>
                                {signupForm.formState.errors.name && (
                                    <p className={presets.error}>{signupForm.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={presets.label}>Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                    </div>
                                    <input
                                        type="email"
                                        {...signupForm.register('email')}
                                        disabled={isSubmitting}
                                        placeholder="Enter your email"
                                        className={cn(
                                            presets.input,
                                            signupForm.formState.errors.email ? 'border-red-500' : ''
                                        )}
                                    />
                                </div>
                                {signupForm.formState.errors.email && (
                                    <p className={presets.error}>{signupForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className={presets.label}>Phone (Optional)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">smartphone</span>
                                    </div>
                                    <input
                                        type="tel"
                                        {...signupForm.register('phone')}
                                        disabled={isSubmitting}
                                        placeholder="Phone number"
                                        className={cn(
                                            presets.input,
                                            signupForm.formState.errors.phone ? 'border-red-500' : ''
                                        )}
                                    />
                                </div>
                                {signupForm.formState.errors.phone && (
                                    <p className={presets.error}>{signupForm.formState.errors.phone.message}</p>
                                )}
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={!signupForm.formState.isValid || isSubmitting}
                                    className={presets.button}
                                >
                                    {isSubmitting ? (
                                        <Spinner size="sm" />
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer - Toggle Mode */}
                <div className="px-6 pb-5 pt-0">
                    <p className="text-center text-xs font-medium text-slate-500">
                        {mode === 'signin' ? (
                            <>
                                Don&apos;t have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('signup')}
                                    disabled={isSubmitting}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Sign Up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('signin')}
                                    disabled={isSubmitting}
                                    className="text-primary font-bold hover:underline"
                                >
                                    Sign In
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
};
