'use client';

import { StepForm } from '@/components/visitor/StepForm';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { motion } from 'framer-motion';

export default function NewUserPreview() {
    const { storeName, logoUrl } = useCustomerFlowStore();

    return (
        <div className="min-h-screen py-12 bg-gray-50 flex flex-col items-center justify-center gap-8">
            <PhoneFrame title="Live Preview Mode: New User">
                <div className="p-6 h-full">
                    <StepForm
                        storeName={storeName || "Your Store"}
                        logoUrl={logoUrl}
                        onBack={() => alert('Back clicked')}
                        onSubmit={(data) => alert('Form submitted: ' + JSON.stringify(data))}
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flow Type</label>
                        <p className="text-sm font-bold text-slate-700">First-time Visitor</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                        <p className="text-sm font-bold text-emerald-500">Unidentified</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
