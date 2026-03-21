'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useDeviceTapContext, useRecordDeviceVisit } from '@/services/devices/hooks';
import Spinner from '@/components/ui/Spinner';

export default function MultiDeviceTapPage() {
    const { deviceId } = useParams();
    const code = deviceId as string;
    const router = useRouter();
    
    const { data: context, isLoading, isError } = useDeviceTapContext(code);
    const { mutateAsync: recordVisitMutation } = useRecordDeviceVisit(code);

    const initializeFromBusiness = useCustomerFlowStore(state => state.initializeFromBusiness);
    const recordVisitLocal = useCustomerFlowStore(state => state.recordVisit);
    const userDataStore = useCustomerFlowStore(state => state.userData);
    const { user } = useAuthStore();

    const storedIdentity = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('google_identity');
        return saved ? JSON.parse(saved) : null;
    }, []);

    useEffect(() => {
        if (!context) return;

        const processTap = async () => {
            // 1. Initialize local store with backend context
            initializeFromBusiness({
                business: context.business,
                branch: context.branch,
                code: context.device.code,
                businessId: context.business.id,
                branchId: context.branch.id,
                name: context.device.name,
                isFirstTimeVisit: !(userDataStore || storedIdentity)
            });

            // 2. Identify user
            const identity = userDataStore || storedIdentity;
            
            // 3. Record visit on backend
            try {
                const visitResponse = await recordVisitMutation({
                    visitorId: user?.id || identity?.id,
                    email: identity?.email,
                    phone: identity?.phone,
                    name: identity?.name
                });

                // Record visit locally
                recordVisitLocal();

                // Earn loyalty if possible
                if (user || (identity && context.business.id)) {
                    const { earnPoints } = useLoyaltyStore.getState();
                    earnPoints({
                        userId: user?.id || identity?.email || identity?.phone || identity?.uniqueId || 'anonymous',
                        businessId: context.business.id,
                        branchId: context.branch.id,
                        isVisit: true
                    }).catch(err => console.error('Failed to earn points:', err));
                }

                // Navigate to next step
                router.push('/user-step');
            } catch (err) {
                console.error('Visit recording failed:', err);
                router.push('/user-step');
            }
        };

        processTap();
    }, [context, initializeFromBusiness, recordVisitLocal, recordVisitMutation, router, storedIdentity, user, userDataStore]);

    if (isError) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl p-12 shadow-xl border border-red-50 text-center">
                    <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl">error</span>
                    </div>
                    <h1 className="text-2xl font-display font-black text-text-main mb-4 tracking-tight">Invalid Device</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                        The device code <strong>{code}</strong> is not recognized or not active.
                    </p>
                    <button onClick={() => router.push('/')} className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
            <div className="text-center">
                <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8 }}
                        className="h-1 bg-primary rounded-full w-16"
                    />
                </div>
                <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">
                        {isLoading ? 'Loading Context' : 'Recording Visit'}
                    </p>
                </div>
            </div>
        </div>
    );
}
