"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, HelpCircle, Megaphone, 
    Users, MessageSquare, Send, BarChart2
} from 'lucide-react';
import { useMessagingStore } from '@/store/useMessagingStore';
import { Button } from '@/components/ui/button';
import { 
    StepCreateCampaign, 
    StepSelectAudience, 
    StepComposeMessage, 
    StepReviewCampaign,
    StepSendingCampaign
} from '@/components/dashboard/messaging/CampaignWizard';

export default function CreateCampaignPage() {
    const router = useRouter();
    const { step, setStep, resetStore } = useMessagingStore();

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.push('/dashboard/messaging');
        }
    };

    const steps = [
        { id: 1, title: 'Create', icon: Megaphone },
        { id: 2, title: 'Audience', icon: Users },
        { id: 3, title: 'Compose', icon: MessageSquare },
        { id: 4, title: 'Review', icon: Send },
        { id: 5, title: 'Sending', icon: BarChart2 },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-36 md:pb-10">
            {/* Top Navigation */}
            <div className="sticky top-0 z-[40] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="mx-auto max-w-2xl flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleBack}
                            className="rounded-full hover:bg-gray-100"
                            disabled={step === 5}
                        >
                            <ArrowLeft className="size-5 text-gray-900" />
                        </Button>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {steps.find(s => s.id === Math.min(step, 5))?.title} Message
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => resetStore()} className="rounded-full text-gray-400">
                        <HelpCircle className="size-5" />
                    </Button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-50">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(step / 5) * 100}%` }}
                        className="h-full bg-[#066CF4] transition-all duration-500"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="mx-auto max-w-2xl p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {step === 1 && <StepCreateCampaign />}
                        {step === 2 && <StepSelectAudience />}
                        {step === 3 && <StepComposeMessage />}
                        {step === 4 && <StepReviewCampaign />}
                        {step >= 5 && <StepSendingCampaign />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Mobile Step Indicator (Floating) */}
            {step < 5 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-100 md:bottom-10">
                    {steps.slice(0, 4).map((s) => (
                        <div 
                            key={s.id}
                            className={`size-2 rounded-full transition-all duration-300 ${
                                step === s.id ? "w-6 bg-[#066CF4]" : "bg-gray-200"
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
