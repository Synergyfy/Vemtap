'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChangePassword } from '@/services/auth/hooks';
import { notify } from '@/lib/notify';
import { Shield, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { motion, AnimatePresence } from 'framer-motion';

export const ForceChangePasswordGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, logout, updateUser } = useAuthStore();
    const { changePassword, isLoading } = useChangePassword();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Only apply to Customer role who hasn't changed their password and isn't a Google user
    const isGoogleUser = !!user?.googleId || user?.authProvider === 'GOOGLE';
    const mustChangePassword = user?.role?.toLowerCase() === 'customer' && !user?.isPasswordChanged && !isGoogleUser;

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            notify.error('New PINs do not match');
            return;
        }

        if (!/^\d{6}$/.test(newPassword)) {
            notify.error('PIN must be exactly 6 digits long');
            return;
        }

        try {
            await changePassword({ currentPassword, newPassword });
            
            // Update local user state so the guard releases
            await updateUser({ isPasswordChanged: true });
            
            notify.success('Security PIN set successfully! Welcome to VemTap.');
        } catch (error: any) {
            notify.error(error.message || 'Verification failed. Please check your temporary PIN.');
        }
    };

    if (!mustChangePassword) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-gray-100 overflow-hidden relative z-10"
            >
                <div className="p-6 md:p-8">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="mb-4">
                            <Logo />
                        </div>
                        
                        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 relative">
                            <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse"></div>
                            <Shield size={28} className="text-primary relative z-10" />
                            <div className="absolute -top-1 -right-1 bg-white p-1 rounded-lg shadow-md">
                                <Lock size={12} className="text-primary" />
                            </div>
                        </div>

                        <h1 className="text-xl md:text-2xl font-display font-bold text-text-main mb-2 tracking-tight">
                            Secure Your Account
                        </h1>
                        <p className="text-text-secondary font-medium text-xs leading-relaxed max-w-sm">
                            Since this is your first time logging in, you must set a new 6-digit security PIN to access your dashboard.
                        </p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-4">
                            {/* Current Password - often the temporary one */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                    Temporary PIN
                                </label>
                                <p className="text-[10px] text-text-secondary/60 font-medium ml-1 -mt-1 leading-relaxed">
                                    Check your email inbox for the temporary PIN we sent you.
                                </p>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter temporary PIN"
                                        required
                                        className="w-full h-14 pl-12 pr-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                    New Security PIN
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Shield size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Exactly 6 digits"
                                        required
                                        className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1">
                                    Verify New Security PIN
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Repeat new PIN"
                                        required
                                        className="w-full h-14 pl-12 pr-5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                type="submit"
                                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full h-14 bg-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Establish New Identity
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => logout()}
                                className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-red-600 transition-colors"
                            >
                                Sign out and try later
                            </button>
                        </div>
                    </form>
                </div>
                
                <div className="bg-gray-50 p-4 border-t border-gray-100/50 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">SSL Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary">Protected Session</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
