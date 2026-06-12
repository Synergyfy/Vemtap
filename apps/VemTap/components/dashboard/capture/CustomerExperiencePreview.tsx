'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Smartphone, User, Phone, Mail, CheckCircle2, 
    Sparkles, ArrowRight, Download, Building2, 
    Send, Database, LineChart
} from 'lucide-react';
import { useCustomerCaptureStore } from '@/store/useCustomerCaptureStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export default function CustomerExperiencePreview() {
    const { formConfig, setStep } = useCustomerCaptureStore();
    const { data: business } = useMyBusiness();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showFinalSuccess, setShowFinalSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }, 500);
    };

    const handleActivate = () => {
        setShowFinalSuccess(true);
    };

    if (showFinalSuccess) {
        return <FinalSuccessScreen />;
    }

    return (
        <div className="flex flex-col gap-6 pb-24">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Preview Customer Experience</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">This is exactly what your customers will see when they scan.</p>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="relative mx-auto w-full max-w-[320px] aspect-[9/19] bg-gray-900 rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden">
                {/* Status Bar */}
                <div className="h-6 w-full bg-transparent flex justify-between px-6 pt-2">
                    <span className="text-[10px] font-bold text-gray-400">9:41</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-2 bg-gray-600 rounded-sm" />
                        <div className="w-3 h-2 bg-gray-600 rounded-sm" />
                    </div>
                </div>

                <div className="h-full w-full bg-white overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">
                        {!isSubmitted ? (
                            <motion.div 
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="p-6 pt-10"
                            >
                                <div className="flex flex-col items-center text-center mb-8">
                                    <div className="h-16 w-16 rounded-2xl bg-gray-50 mb-4 flex items-center justify-center overflow-hidden border border-gray-100">
                                        {business?.logoUrl ? <img src={business.logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Building2 className="text-gray-300" />}
                                    </div>
                                    <h2 className="text-lg font-black text-gray-900">{business?.name || 'Your Business'}</h2>
                                    <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-widest">Customer Registration</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                                        <input disabled placeholder="John Doe" className="w-full h-10 rounded-xl bg-gray-50 border-none px-4 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Phone Number</label>
                                        <input disabled placeholder="+234 ..." className="w-full h-10 rounded-xl bg-gray-50 border-none px-4 text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Email Address</label>
                                        <input disabled placeholder="john@email.com" className="w-full h-10 rounded-xl bg-gray-50 border-none px-4 text-xs font-bold" />
                                    </div>

                                    {formConfig.fields.birthday && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Birthday</label>
                                            <input disabled type="date" className="w-full h-10 rounded-xl bg-gray-50 border-none px-4 text-xs font-bold" />
                                        </div>
                                    )}

                                    <div className="pt-2 flex items-start gap-2">
                                        <div className="size-4 rounded bg-[#066CF4] flex items-center justify-center shrink-0 mt-0.5">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                        <p className="text-[9px] font-medium text-gray-500 leading-tight">
                                            {formConfig.consentText}
                                        </p>
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white mt-4">
                                        Register Now
                                    </Button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex flex-col items-center justify-center p-8 text-center"
                            >
                                <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Thank You</h2>
                                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                                    Your information has been successfully submitted. You'll receive updates and special offers from this business.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsSubmitted(false)}
                                    className="mt-12 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-gray-100"
                                >
                                    Reset Preview
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* CRM Record Preview */}
            <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 mt-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Database size={18} />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">CRM Entry Preview</h3>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="size-12 rounded-full bg-[#066CF4]/10 text-[#066CF4] flex items-center justify-center font-black text-xs">JD</div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">John Doe</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Newly Registered</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
                            <p className="text-[10px] font-bold text-gray-700">0800 000 0000</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                            <p className="text-[10px] font-bold text-gray-700">john@email.com</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activation Readiness Card */}
            <div className="rounded-[32px] bg-emerald-50 p-6 border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Activation Readiness</h3>
                    <Badge className="bg-emerald-500 text-white border-none font-black text-[9px]">100% READY</Badge>
                </div>
                <div className="space-y-2">
                    {['QR Generated', 'QR Customized', 'QR Downloaded', 'Form Configured', 'Experience Tested'].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-800">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 flex gap-4">
                <Button 
                    variant="ghost"
                    onClick={() => setStep(4)}
                    className="h-14 flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                >
                    Back
                </Button>
                <Button 
                    onClick={handleActivate}
                    className="h-14 flex-[2] rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >
                    Finalize Setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

function FinalSuccessScreen() {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full"
            >
                <div className="relative mx-auto mb-10 size-32 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 size={64} />
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-4 -top-4 text-emerald-400"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                </div>

                <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">
                    🎉 You're Ready To Capture Customers
                </h1>
                <p className="text-lg font-medium text-gray-500 mb-12">
                    Your QR code and customer registration experience are now live. Start building your database today!
                </p>

                <div className="space-y-4 mb-12">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Next Recommended Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { icon: Download, label: 'Print Your QR Code' },
                            { icon: Building2, label: 'Place It In Your Business' },
                            { icon: User, label: 'Capture Your First Customer' },
                            { icon: LineChart, label: 'Start Building Database' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left">
                                <div className="size-10 rounded-xl bg-white flex items-center justify-center text-[#066CF4] shadow-sm">
                                    <item.icon size={20} />
                                </div>
                                <span className="text-xs font-bold text-gray-900">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="h-16 w-full rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20"
                    >
                        Go To Dashboard
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100">
                            Download QR Again
                        </Button>
                        <Button variant="outline" className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest border-gray-100">
                            View Database
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
