'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { fetchDeviceByCode } from '@/lib/api/devices';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { motion } from 'framer-motion';

export default function PublicTapPage() {
    // Note: Parameter name must match directory '[businessId]' to avoid Next.js routing conflicts
    // here, 'businessId' will contain the unique device Code (e.g. C0COUXVY5).
    const { businessId } = useParams();
    const router = useRouter();
    const initializeFromBusiness = useCustomerFlowStore(state => state.initializeFromBusiness);
    const recordVisit = useCustomerFlowStore(state => state.recordVisit);
    const [error, setError] = useState(false);

    useEffect(() => {
        const handleTap = async () => {
            if (!businessId) return;

            try {
                // Fetch live device details using the public @Get('loyalty/device-info/:code') endpoint
                const device = await fetchDeviceByCode(businessId as string);

                if (device) {
                    // Initialize the customer flow with live data
                    initializeFromBusiness({
                        id: device.business?.id || device.businessId || 'legacy-id',
                        name: device.business?.name || device.name,
                        type: device.business?.type || 'RETAIL',
                        welcomeMessage: device.business?.welcomeMessage || 'Welcome! Please fill in your details to stay connected.',
                        welcomeTitle: device.business?.welcomeTitle || 'Welcome',
                        newUserWelcomeMessage: device.business?.welcomeMessage || 'Welcome! Please fill in your details to stay connected.',
                        newUserWelcomeTitle: device.business?.welcomeTitle || 'Welcome',
                        successMessage: device.business?.successMessage || 'Thank you for visiting! We look forward to seeing you again.',
                        rewardEnabled: device.business?.rewardEnabled ?? false,
                        logoUrl: device.business?.logoUrl || null,
                        branchId: device.branchId,
                        currentDeviceId: device.id,
                        deviceCode: device.code,
                        deviceName: device.name,
                        isFirstTimeVisit: device.isFirstTimeVisit ?? true
                    } as any);

                    // Record the visit logic - if returning, we skip the scanning animation
                    if (!device.isFirstTimeVisit) {
                        recordVisit();
                    }

                    // Get the business slug (prefer name for the URL)
                    const businessSlug = (device.business?.name || 'business').toLowerCase().replace(/\s+/g, '-');
                    const targetCode = device.code || businessId;

                    // Redirect to the dynamic business/code route with same query params (source, v, n etc.)
                    const search = typeof window !== 'undefined' ? window.location.search : '';
                    router.push(`/${businessSlug}/${targetCode}${search}`);
                } else {
                    console.warn('Device not found for code:', businessId);
                    setError(true);
                }
            } catch (err) {
                console.error('Tap processing failed:', err);
                setError(true);
            }
        };

        handleTap();
    }, [businessId, initializeFromBusiness, recordVisit, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl p-12 shadow-xl border border-red-50 text-center">
                    <div className="size-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-icons-round text-3xl">error_outline</span>
                    </div>
                    <h1 className="text-2xl font-display font-black text-text-main mb-4 tracking-tight">Invalid Link</h1>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                        The code <strong>{businessId}</strong> is not recognized or has been deactivated.
                    </p>
                    <button onClick={() => router.push('/')} className="w-full h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
            <div className="text-center">
                <div className="size-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 mx-auto relative">
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                    <div className="size-3 bg-primary rounded-full" />
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">
                    Authenticating Tap
                </p>
            </div>
        </div>
    );
}
