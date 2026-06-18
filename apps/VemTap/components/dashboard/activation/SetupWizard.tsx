'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, CheckCircle2, QrCode, Download, Users, Megaphone, 
    Building, ArrowRight, Save, Image as ImageIcon,
    Printer, FileDown, Sparkles
} from 'lucide-react';
import { useActivationStore, ActivationStep } from '@/store/useActivationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SetupWizardProps {
    onFinish?: () => void;
}

export default function SetupWizard({ onFinish }: SetupWizardProps) {
    const { 
        isWizardOpen, 
        setWizardOpen, 
        currentWizardStep, 
        setWizardStep,
        completeStep,
        completedSteps
    } = useActivationStore();

    if (!isWizardOpen) return null;

    const steps = [
        { id: 'profile', title: 'Complete Profile' },
        { id: 'qr', title: 'My Business QR' },
        { id: 'assets', title: 'Download Assets' },
        { id: 'customer', title: 'Capture First Customer' },
        { id: 'campaign', title: 'Send First Campaign' },
    ];

    const currentStepData = steps[currentWizardStep - 1];

    const handleNext = () => {
        completeStep(currentStepData.id as ActivationStep);
        if (currentWizardStep < 5) {
            setWizardStep(currentWizardStep + 1);
        } else {
            setWizardOpen(false);
            if (onFinish) onFinish();
        }
    };

    const handleBack = () => {
        if (currentWizardStep > 1) {
            setWizardStep(currentWizardStep - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 p-4 backdrop-blur-xl">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setWizardOpen(false)}
                    className="rounded-full hover:bg-gray-100"
                >
                    <X className="h-6 w-6 text-gray-900" />
                </Button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Step {currentWizardStep} of 5</span>
                    <span className="text-sm font-bold text-gray-900">{currentStepData.title}</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentWizardStep / 5) * 100}%` }}
                    className="h-full bg-[#066CF4] transition-all duration-500"
                />
            </div>

            {/* Content Area */}
            <div className="flex-1 px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentWizardStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="mx-auto max-w-md"
                    >
                        {currentWizardStep === 1 && <StepProfile />}
                        {currentWizardStep === 2 && <StepQRCode />}
                        {currentWizardStep === 3 && <StepAssets />}
                        {currentWizardStep === 4 && <StepCapture />}
                        {currentWizardStep === 5 && <StepCampaign />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="sticky bottom-0 border-t bg-white p-6 backdrop-blur-xl">
                <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack}
                        disabled={currentWizardStep === 1}
                        className="h-14 flex-1 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 disabled:opacity-30"
                    >
                        Back
                    </Button>
                    <Button 
                        onClick={handleNext}
                        className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {currentWizardStep === 5 ? 'Finish Setup' : 'Continue'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StepProfile() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Complete Your Business Profile</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Customers will see this information when they scan your code.</p>
            </div>

            <div className="space-y-4">
                <div className="rounded-[32px] border-2 border-dashed border-gray-200 p-8 text-center transition-all hover:border-[#066CF4]/30 hover:bg-blue-50/30">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 text-gray-400">
                        <ImageIcon size={32} />
                    </div>
                    <div className="mt-4">
                        <span className="text-xs font-black uppercase tracking-widest text-[#066CF4]">Upload Logo</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Business Name</label>
                    <input 
                        type="text" 
                        placeholder="Vemtap Business" 
                        className="w-full h-14 rounded-2xl bg-gray-50 border-none px-6 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-[#066CF4]/20 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Description</label>
                    <textarea 
                        placeholder="Tell customers about your business..." 
                        className="w-full min-h-[120px] rounded-2xl bg-gray-50 border-none p-6 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-[#066CF4]/20 transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
}

function StepQRCode() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Your Business QR Code</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">This is your primary QR code. Customers scan it to connect with your business.</p>
            </div>

            <div className="flex flex-col items-center">
                <div className="relative p-8 rounded-[40px] bg-white shadow-2xl shadow-black/5 border border-gray-100">
                    <div className="h-48 w-48 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                        <QrCode size={120} />
                    </div>
                    <div className="absolute -right-4 -top-4 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg animate-bounce">
                        <Sparkles size={20} />
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <Button variant="outline" className="h-14 rounded-2xl border-gray-100 text-xs font-black uppercase tracking-widest">
                        <FileDown className="mr-2 h-4 w-4 text-[#066CF4]" />
                        PNG
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-gray-100 text-xs font-black uppercase tracking-widest">
                        <FileDown className="mr-2 h-4 w-4 text-[#066CF4]" />
                        PDF
                    </Button>
                </div>
                <Button variant="outline" className="mt-4 h-14 w-full rounded-2xl border-gray-100 text-xs font-black uppercase tracking-widest">
                    <Printer className="mr-2 h-4 w-4 text-[#066CF4]" />
                    Print Poster
                </Button>
            </div>
        </div>
    );
}

function StepAssets() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Promote Your QR Code</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Download ready-made materials for your business.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {['Poster', 'Table Tent', 'Counter Display', 'Flyer'].map((asset) => (
                    <div key={asset} className="group relative rounded-3xl bg-gray-50 p-4 border border-transparent transition-all hover:border-[#066CF4]/20 hover:bg-white hover:shadow-xl hover:shadow-black/5">
                        <div className="aspect-square bg-gray-200 rounded-2xl mb-4 flex items-center justify-center text-gray-400">
                            <ImageIcon size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{asset}</span>
                        <Button size="icon" className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-[#066CF4] opacity-0 group-hover:opacity-100 transition-all">
                            <Download size={14} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepCapture() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Get Your First Customer</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Your first registration is only one scan away.</p>
            </div>

            <div className="rounded-[32px] bg-blue-50/50 p-8 border border-blue-100">
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-[#066CF4] shadow-sm">1</div>
                        <p className="text-sm font-bold text-gray-900">Place your QR code in a visible spot.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-[#066CF4] shadow-sm">2</div>
                        <p className="text-sm font-bold text-gray-900">Scan it yourself to test the experience.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-black text-[#066CF4] shadow-sm">3</div>
                        <p className="text-sm font-bold text-gray-900">Share it with customers on social media.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-[32px] bg-white p-8 border border-gray-100 text-center">
                <div className="text-5xl font-black text-gray-900 mb-2">0</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Customers Captured</div>
            </div>
        </div>
    );
}

function StepCampaign() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Reach Your Customers</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Send your first marketing campaign to your new database.</p>
            </div>

            <div className="space-y-4">
                {['Welcome Message', 'Exclusive Promotion', 'New Announcement'].map((type) => (
                    <button key={type} className="w-full group flex items-center justify-between p-6 rounded-3xl bg-gray-50 border border-transparent transition-all hover:border-[#066CF4]/20 hover:bg-white hover:shadow-xl hover:shadow-black/5 active:scale-[0.98]">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#066CF4] transition-colors">
                                <Megaphone size={20} />
                            </div>
                            <span className="text-sm font-black text-gray-900">{type}</span>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                    </button>
                ))}
            </div>
        </div>
    );
}
