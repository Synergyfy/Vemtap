"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, HelpCircle, QrCode, Palette, 
    Type, Layout, Image as ImageIcon, Sparkles, 
    Download, Check, Smartphone, ChevronRight,
    ArrowRight
} from 'lucide-react';
import { useMarketingAssetStore } from '@/store/useMarketingAssetStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBrandProfile } from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import { StepAssetType, StepMarketingGoal, MarketingTemplateEngine } from '@/components/dashboard/marketing/WizardSteps';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CreateAssetWizardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get('type');
    
    const { 
        step, setStep, assetType, setAssetType, 
        goal, setGoal, content, updateContent, 
        branding, updateBranding, resetStore 
    } = useMarketingAssetStore();
    
    const { data: business } = useMyBusiness();
    const { data: brandProfile } = useBrandProfile();

    // Pre-fill business info
    useEffect(() => {
        if (business) {
            updateContent({
                businessName: business.name,
                website: business.website || '',
                phone: business.phone || '',
                email: business.officialEmail || '',
            });
            
            if (business.logoUrl) {
                updateBranding({ logo: business.logoUrl });
            }
        }
    }, [business, updateContent, updateBranding]);

    // Handle initial type from URL
    useEffect(() => {
        if (typeParam && !assetType) {
            setAssetType(typeParam as any);
            setStep(3); // Start at goal selection if type is known
        }
    }, [typeParam, assetType, setAssetType, setStep]);
    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        } else {
            router.push('/dashboard/marketing-assets');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-10">
            {/* Top Navigation */}
            <div className="sticky top-0 z-[40] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="mx-auto max-w-2xl flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleBack}
                            className="rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft className="size-5 text-gray-900" />
                        </Button>
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {step === 1 ? 'Select Type' : step === 3 ? 'Choose Goal' : step === 4 ? 'Customize' : 'Preview'}
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
                        animate={{ width: `${(step / 10) * 100}%` }}
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
                        {step === 1 && <StepAssetType />}
                        {step === 3 && <StepMarketingGoal />}
                        {(step >= 4 && step <= 7) && <StepCustomization step={step} />}
                        {step === 8 && <StepLivePreview />}
                        {step === 9 && <StepDownload />}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Floating Navigation Bottom (For custom steps) */}
            {step >= 4 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-gray-100 min-w-[320px]">
                    <Button 
                        variant="ghost" 
                        onClick={handleBack}
                        className="h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                        Back
                    </Button>
                    <Button 
                        onClick={() => setStep(step + 1)}
                        className="h-12 flex-1 rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {step === 9 ? 'Finish' : 'Continue'}
                        <ChevronRight className="ml-2 size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

function StepCustomization({ step }: { step: number }) {
    const { content, updateContent, branding, updateBranding, assetType } = useMarketingAssetStore();

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Live Preview Card */}
            <div className="sticky top-20 z-20 rounded-[40px] bg-white p-4 shadow-xl border border-blue-100">
                <div className="mb-2 text-center text-[8px] font-black uppercase tracking-[0.2em] text-blue-500">Live Design Preview</div>
                <div className="max-w-[240px] mx-auto scale-90 origin-top">
                    <MarketingTemplateEngine asset={{ content, branding }} />
                </div>
            </div>

            {step === 4 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-gray-900">Customize Content</h2>
                        <p className="text-sm font-medium text-gray-500 mt-2">Edit the text that appears on your {assetType}.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Headline</label>
                            <input 
                                value={content.headline}
                                onChange={(e) => updateContent({ headline: e.target.value })}
                                className="w-full h-14 rounded-2xl bg-white border border-gray-100 px-6 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Subheadline</label>
                            <textarea 
                                value={content.subheadline}
                                onChange={(e) => updateContent({ subheadline: e.target.value })}
                                className="w-full min-h-[100px] rounded-2xl bg-white border border-gray-100 p-6 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Call To Action</label>
                            <input 
                                value={content.ctaText}
                                onChange={(e) => updateContent({ ctaText: e.target.value })}
                                className="w-full h-14 rounded-2xl bg-white border border-gray-100 px-6 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-gray-900">Brand Identity</h2>
                        <p className="text-sm font-medium text-gray-500 mt-2">Make this asset uniquely yours.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-[32px] bg-white p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Primary Brand Color</h3>
                            <div className="flex flex-wrap gap-3">
                                {['#066CF4', '#000000', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B'].map((color) => (
                                    <button 
                                        key={color}
                                        onClick={() => updateBranding({ primaryColor: color })}
                                        className={cn(
                                            "size-10 rounded-xl border-4 transition-all",
                                            branding.primaryColor === color ? "border-blue-100 scale-110" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[32px] bg-white p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">QR Code Style</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['square', 'rounded', 'dots', 'modern'].map((s) => (
                                    <button 
                                        key={s}
                                        onClick={() => updateBranding({ qrStyle: s as any })}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                            branding.qrStyle === s ? "border-[#066CF4] bg-blue-50/30 text-[#066CF4]" : "border-gray-50 bg-gray-50 text-gray-400"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StepLivePreview() {
    const { content, branding, assetType } = useMarketingAssetStore();
    return (
        <div className="space-y-8 pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Realistic Mockup</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">See your {assetType} in a real business environment.</p>
            </div>

            <div className="relative group overflow-hidden rounded-[48px] bg-gray-900 shadow-2xl aspect-[4/5] flex items-center justify-center">
                <img 
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop" 
                    className="absolute inset-0 size-full object-cover opacity-50 grayscale"
                    alt="Mockup background"
                />
                <div className="relative z-10 w-[60%] rotate-[-2deg] drop-shadow-[0_35px_35px_rgba(0,0,0,0.5)]">
                    <MarketingTemplateEngine asset={{ content, branding }} />
                </div>
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Mockup View: Restaurant Table</p>
                </div>
            </div>
        </div>
    );
}

function StepDownload() {
    const { assetType } = useMarketingAssetStore();
    return (
        <div className="space-y-8 pb-20">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Ready For Download</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Your high-resolution files are generated and ready.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {[
                    { id: 'pdf_print', label: 'Print Ready PDF', desc: 'Highest resolution, vector-based.', format: 'PDF', size: '2.4 MB' },
                    { id: 'png', label: 'High-Res PNG', desc: 'Best for digital sharing.', format: 'PNG', size: '1.1 MB' },
                    { id: 'jpg', label: 'Optimized JPG', desc: 'Compressed for fast loading.', format: 'JPG', size: '450 KB' },
                ].map((f) => (
                    <button 
                        key={f.id}
                        className="group flex items-center justify-between p-6 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                                <Download size={24} />
                            </div>
                            <div className="text-left">
                                <h3 className="text-base font-bold text-gray-900">{f.label}</h3>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{f.format} • {f.size}</p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-gray-200 group-hover:text-emerald-500 transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
}