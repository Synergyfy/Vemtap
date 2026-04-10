'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Fingerprint, User, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useSudoStore } from '@/store/useSudoStore';

export default function AdminViewerBanner() {
    const { user } = useAuthStore();
    const { activeSession, endSession } = useSudoStore();
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [isDismissed, setIsDismissed] = useState(false);
    const router = useRouter();

    // Sync secondsLeft with the session's expiresAt
    useEffect(() => {
        if (!activeSession) return;

        const updateTimer = () => {
            const now = Date.now();
            const left = Math.max(0, Math.floor((activeSession.expiresAt - now) / 1000));
            setSecondsLeft(left);

            if (left <= 0) {
                handleEndSession();
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [activeSession]);

    const handleEndSession = () => {
        const type = activeSession?.type;
        endSession();
        
        // Redirect back to control tower on end/expiry
        const target = type === 'business' 
            ? '/admin/control-tower/business-override' 
            : '/admin/control-tower/customer-override';
        
        router.push(target);
    };

    if (!activeSession) return null;

    const isUrgent = secondsLeft <= 300; // 5 minutes

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isDismissed && !isUrgent) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`relative p-1 rounded-2xl shadow-2xl ${isUrgent ? 'bg-rose-500' : 'bg-indigo-600'} shadow-lg`}>
                {!isUrgent && (
                    <button 
                        onClick={() => setIsDismissed(true)}
                        className="absolute -top-2 -right-2 size-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all z-10"
                        title="Dismiss Banner"
                    >
                        <XCircle size={14} />
                    </button>
                )}
                <div className="bg-white rounded-xl py-3 px-5 flex items-center gap-4 border border-white/20">
                    <div className={`flex items-center justify-center size-10 rounded-xl ${isUrgent ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                        <ShieldAlert size={20} className={isUrgent ? 'animate-pulse' : ''} />
                    </div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary leading-none">
                                Admin Sudo Session
                            </p>
                            {activeSession.subjectId && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 font-mono">
                                    <Fingerprint size={10} />
                                    {activeSession.subjectId}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Clock size={14} className={isUrgent ? 'text-rose-500' : 'text-indigo-600'} />
                            <span className={`text-sm font-black tabular-nums ${isUrgent ? 'text-rose-600' : 'text-text-main'}`}>
                                {formatTime(secondsLeft)}
                            </span>
                            <div className="h-3 w-[1px] bg-gray-200 mx-1" />
                            <div className="flex items-center gap-1.5">
                                <User size={12} className="text-text-secondary" />
                                <span className="text-xs font-bold text-text-secondary">
                                    Handler: {user?.name || user?.email || 'Admin'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={`h-8 w-[1px] ${isUrgent ? 'bg-rose-100' : 'bg-gray-100'}`} />

                    <div className="hidden sm:block max-w-[180px]">
                        <p className="text-[10px] font-bold text-text-secondary leading-tight line-clamp-2">
                           {isUrgent ? 'Session ending soon. Redirecting shortly.' : `Authorized access to ${activeSession.type} data. All actions are currently being logged.`}
                        </p>
                    </div>

                    <div className="flex items-center ml-2 border-l border-gray-100 pl-4">
                        <button
                            onClick={handleEndSession}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95"
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
