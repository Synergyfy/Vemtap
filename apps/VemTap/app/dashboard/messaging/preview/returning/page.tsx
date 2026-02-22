'use client';

import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { motion } from 'framer-motion';

export default function ReturningGuestPreview() {
    const { storeName, logoUrl } = useCustomerFlowStore();

    const mockUserData = {
        name: 'Daniel Peterson',
        email: 'daniel@example.com',
        phone: '+234 801 234 5678'
    };

    return (
        <div className="min-h-screen py-12 bg-gray-50 flex flex-col items-center justify-center gap-8">
            <PhoneFrame title="Live Preview Mode: Returning User">
                <div className="p-6 h-full">
                    <StepWelcomeBack
                        storeName={storeName || "Your Store"}
                        logoUrl={logoUrl}
                        userData={mockUserData}
                        visitCount={4}
                        rewardVisitThreshold={5}
                        hasRewardSetup={true}
                        redemptionStatus="none"
                        onRedeem={() => alert('Redeem clicked')}
                        onContinue={() => alert('Continue clicked')}
                        onClear={() => alert('Clear clicked')}
                    />
                </div>
            </PhoneFrame>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
            >
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <span className="size-2 bg-primary rounded-full animate-pulse" />
                    Preview Controls
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visit Count</label>
                        <p className="text-sm font-bold text-slate-700">4 / 5</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward Status</label>
                        <p className="text-sm font-bold text-emerald-500">Active</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
