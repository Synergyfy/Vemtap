'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, HelpCircle, ArrowLeft, QrCode, 
    Palette, Download, FileText, Smartphone 
} from 'lucide-react';
import { useCustomerCaptureStore } from '@/store/useCustomerCaptureStore';
import { Button } from '@/components/ui/button';
import QRGenerator from '@/components/dashboard/capture/QRGenerator';
import QRStylizer from '@/components/dashboard/capture/QRStylizer';
import QRDownloader from '@/components/dashboard/capture/QRDownloader';
import FormConfigurator from '@/components/dashboard/capture/FormConfigurator';
import CustomerExperiencePreview from '@/components/dashboard/capture/CustomerExperiencePreview';

export default function CustomerCaptureSetupPage() {
    const { currentStep, setStep } = useCustomerCaptureStore();

    const steps = [
        { id: 1, title: 'Generate QR', icon: QrCode },
        { id: 2, title: 'Customize', icon: Palette },
        { id: 3, title: 'Download', icon: Download },
        { id: 4, title: 'Setup Form', icon: FileText },
        { id: 5, title: 'Preview', icon: Smartphone },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-10">
            {/* Top Navigation */}
            <div className="sticky top-0 z-[40] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="mx-auto max-w-2xl flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setStep(Math.max(1, currentStep - 1))}
                            className="rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft className="size-5 text-gray-900" />
                        </Button>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {steps.find(s => s.id === currentStep)?.title}
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full text-gray-400">
                        <HelpCircle className="size-5" />
                    </Button>
                </div>

                {/* Progress Indicator */}
                <div className="w-full h-1 bg-gray-50">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / 5) * 100}%` }}
                        className="h-full bg-[#066CF4] transition-all duration-500"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-2xl p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {currentStep === 1 && <QRGenerator />}
                        {currentStep === 2 && <QRStylizer />}
                        {currentStep === 3 && <QRDownloader />}
                        {currentStep === 4 && <FormConfigurator />}
                        {currentStep === 5 && <CustomerExperiencePreview />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Mobile Step Indicator (Floating) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl border border-gray-100 md:bottom-10">
                {steps.map((step) => (
                    <div 
                        key={step.id}
                        className={`size-2.5 rounded-full transition-all duration-300 ${
                            currentStep === step.id ? "w-8 bg-[#066CF4]" : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
