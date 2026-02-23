'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getBusinessBySlug, getBusinessByNfcId } from '@/lib/businessService';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useMockDashboardStore } from '@/lib/store/mockDashboardStore';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

export default function MultiDeviceTapPage() {
    const { businessId, deviceId } = useParams();
    const router = useRouter();
    const initializeFromBusiness = useCustomerFlowStore(state => state.initializeFromBusiness);
    const recordVisit = useCustomerFlowStore(state => state.recordVisit);
    const userDataStore = useCustomerFlowStore(state => state.userData);
    const recordExternalTap = useMockDashboardStore(state => state.recordExternalTap);
    const { user } = useAuthStore();
    const [error, setError] = useState(false);

    // Form Initialization (Device-First Check)
    const storedIdentity = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const saved = localStorage.getItem('google_identity');
        return saved ? JSON.parse(saved) : null;
    }, []);

    useEffect(() => {
        const fetchBusiness = async () => {
            if (!businessId || !deviceId) return;

            // 1. Try to find business by slug/ID
            let business = await getBusinessBySlug(businessId as string);

            // 2. If not found, check if it matches the current logged in session
            if (!business && user && user.businessName) {
                const sessionSlug = user.businessName.replace(/\s+/g, '-').toUpperCase();
                if (businessId === sessionSlug) {
                    business = {
                        id: 'SESSION-BUS-ID',
                        slug: sessionSlug,
                        nfcId: deviceId as string,
                        name: user.businessName,
                        type: 'RESTAURANT',
                        welcomeMessage: `Welcome to ${user.businessName}`,
                        successMessage: "See you next time!",
                        privacyMessage: "Fast and secure check-in activated.",
                        rewardMessage: "10% Off your next meal",
                        rewardEnabled: true
                    };
                }
            }

            if (business) {
                // Simulate mapping deviceId to branchId
                const branchMapping: Record<string, string> = {
                    'DEV-001': 'head-office',
                    'DEV-002': 'head-office',
                    'DEV-003': 'ikeja-branch',
                    'DEV-004': 'abuja-branch'
                };
                const assignedBranchId = branchMapping[deviceId as string] || 'head-office';

                // Initialize store with both business and specific device context
                initializeFromBusiness({
                    ...business,
                    branchId: assignedBranchId,
                    currentDeviceId: deviceId as string
                });

                // Check-in logic: Ensure a unique ID is assigned even for anonymous taps
                let identity = userDataStore || storedIdentity;

                if (!identity) {
                    // Pre-generate a unique visitor ID for this session
                    const anonymousId = `T-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
                    identity = {
                        name: 'Anonymous Visitor',
                        uniqueId: anonymousId
                    };

                    // Save to store so it persists through the form filling
                    useCustomerFlowStore.getState().setUserData(identity);
                }

                recordVisit();
                recordExternalTap({
                    ...identity,
                    phone: (identity as any).phone || '',
                    branchId: assignedBranchId
                });

                // Loyalty Integration: Earn points if user is logged in
                if (user) {
                    const { earnPoints } = useLoyaltyStore.getState();
                    earnPoints({
                        userId: user.id || 'current-user',
                        businessId: business.id,
                        branchId: assignedBranchId,
                        isVisit: true
                    }).catch(err => console.error('Failed to earn loyalty points:', err));
                }

                // If it was a known user, go to welcome back
                if (userDataStore || storedIdentity) {
                    router.push('/user-step');
                } else {
                    // For new anonymous taps, user-step will handle the journey
                    router.push('/user-step');
                }
            } else {
                setError(true);
            }
        };

        fetchBusiness();
    }, [businessId, deviceId, initializeFromBusiness, router, user, userDataStore, storedIdentity, recordVisit, recordExternalTap]);

    if (error) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl p-12 shadow-xl border border-red-50 text-center">
                    <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-3xl">error</span>
                    </div>
                    <h1 className="text-2xl font-display font-black text-text-main mb-4 tracking-tight">Invalid Device Link</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                        The business <strong>{businessId}</strong> or device <strong>{deviceId}</strong> is not recognized.
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
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">
                    Authenticating Tap
                </p>
            </div>
        </div>
    );
}
