'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Fingerprint, User, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminBusiness } from '@/services/businesses/hooks';
import { useAdminUser } from '@/services/users/hooks';

interface AdminViewerBannerProps {
    durationMinutes?: number;
    subjectId?: string | null;
    type?: 'business' | 'customer';
}

export default function AdminViewerBanner({ 
    durationMinutes = 15, 
    subjectId,
    type = 'business'
}: AdminViewerBannerProps) {
    const { user } = useAuthStore();
    const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
    const [isDismissed, setIsDismissed] = useState(false);
    const router = useRouter();
    const stopImpersonation = useAuthStore(s => s.stopImpersonation);
    
    const getReturnTarget = () => {
        const role = user?.role?.toLowerCase();
        if (role === 'admin') return '/admin/dashboard';
        if (role === 'agent') return '/admin/agent-hub';
        return type === 'business' 
            ? '/admin/control-tower/business-override' 
            : '/admin/control-tower/customer-override';
    };

    const isUrgent = secondsLeft <= 300; // 5 minutes

    useEffect(() => {
        if (isUrgent) {
            setIsDismissed(false); // Force show when urgent
        }
    }, [isUrgent]);

    useEffect(() => {
        if (secondsLeft <= 0) {
            // Redirect back to control tower on expiry
            stopImpersonation();
            router.push(getReturnTarget());
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft, type, router]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const { data: adminBusiness } = useAdminBusiness(type === 'business' ? (subjectId === null ? undefined : subjectId) : undefined);
    const { data: adminUser } = useAdminUser(type === 'customer' ? (subjectId === null ? undefined : subjectId) : undefined);

    const businessData = adminBusiness?.data || adminBusiness;
    const userData = adminUser?.data || adminUser;

    const getSubjectName = () => {
        if (type === 'business') {
            const b = businessData?.business || businessData;
            return b?.name || b?.businessName || '';
        } else {
            const u = userData?.user || userData;
            return u?.name || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || '';
        }
    };

    const subjectName = getSubjectName();

    if (isDismissed && !isUrgent) return null;

    return (
        <div className="fixed top-0 left-0 right-0 sm:top-6 sm:right-6 sm:left-auto z-9999 animate-in fade-in slide-in-from-top-4 duration-500 w-full sm:w-auto px-4 py-2 sm:p-0">
            <div className={`relative p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-2xl ${isUrgent ? 'bg-rose-500' : 'bg-indigo-600'} shadow-lg`}>
                {!isUrgent && (
                    <button 
                        onClick={() => setIsDismissed(true)}
                        className="absolute -bottom-2 -right-2 sm:-top-2 sm:-right-2 size-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all z-10"
                        title="Dismiss Banner"
                    >
                        <XCircle size={14} />
                    </button>
                )}
                <div className="bg-white rounded-lg sm:rounded-xl py-2 sm:py-3 px-3 sm:px-5 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 border border-white/20">
                    <div className={`flex items-center justify-center size-8 sm:size-10 rounded-lg sm:rounded-xl ${isUrgent ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <ShieldAlert size={18} className={isUrgent ? 'animate-pulse' : ''} />
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-text-secondary leading-none">
                                Admin Sudo Session
                            </p>
                            {subjectId && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[8px] sm:text-[9px] font-bold text-gray-500 font-mono">
                                    <Fingerprint size={10} />
                                    {subjectId.slice(0, 8)}...
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 sm:mt-1.5">
                            <Clock size={12} className={isUrgent ? 'text-rose-500' : 'text-indigo-600'} />
                            <span className={`text-xs sm:text-sm font-black tabular-nums ${isUrgent ? 'text-rose-600' : 'text-text-main'}`}>
                                {formatTime(secondsLeft)}
                            </span>
                            <div className="h-3 w-px bg-gray-200 mx-0.5 sm:mx-1" />
                            <div className="flex items-center gap-1.5 min-w-0">
                                <User size={12} className="text-indigo-600 shrink-0" />
                                <span className="text-[11px] sm:text-xs font-black text-text-main truncate">
                                    {subjectName || 'Fetching...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block max-w-[150px]">
                        <p className="text-[9px] font-bold text-text-secondary leading-tight line-clamp-2">
                           {isUrgent ? 'Session ending soon.' : `Admin: ${user?.name || user?.email || 'Admin'}`}
                        </p>
                    </div>

                    <div className="flex items-center sm:ml-2 sm:border-l border-gray-100 sm:pl-4 w-full sm:w-auto pt-2 sm:pt-0">
                        <button
                            onClick={() => {
                                stopImpersonation();
                                router.push(getReturnTarget());
                            }}
                            className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
                        >
                            <XCircle size={14} />
                            End Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
