'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import { buildBrandCssVars } from '@/lib/brandColor';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { 
    Smartphone, 
    Layers, 
    Palette, 
    ChevronRight, 
    LayoutDashboard,
    QrCode,
    Zap,
    CheckCircle2,
    MessageSquare,
    Loader2,
    Eye,
    Settings2
} from 'lucide-react';

// Step Components
import { HardwareStep } from './components/HardwareStep';
import { SequenceStep } from './components/SequenceStep';
import { AppearanceStep } from './components/AppearanceStep';
import { ContentStep } from './components/ContentStep';

// Visitor Preview Components
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { PortalWelcome } from '@/components/visitor/PortalWelcome';

const STEPS = [
    { id: 'hardware', label: 'Hardware & Links', icon: Smartphone, description: 'Manage NFC & QR Assets' },
    { id: 'content', label: 'Text & Messaging', icon: MessageSquare, description: 'Edit Form Content' },
    { id: 'sequence', label: 'Sequence & Flow', icon: Layers, description: 'Engagement Actions' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Brand Look & Feel' },
];

export default function CustomerExperiencePage() {
    const [activeStep, setActiveStep] = useState<'hardware' | 'content' | 'sequence' | 'appearance'>('hardware');
    const [previewTab, setPreviewTab] = useState<'check-in' | 'returning' | 'outcome' | 'ubl'>('check-in');
    
    const { user } = useAuthStore();
    const { activeBranchId } = useActiveBranch();
    const { data: business } = useMyBusiness();
    const { data: branches = [] } = useBranches();
    const { engagementSettings, getBusinessConfig, hasRewardSetup } = useCustomerFlowStore();

    const activeBranch = branches.find(b => b.id === activeBranchId);
    const brandColor = engagementSettings?.brandColor || activeBranch?.formAppearanceColor || business?.brandColor || '#2563eb';
    const brandVars = useMemo(() => buildBrandCssVars(brandColor), [brandColor]);

    const resolvedBranchId = activeBranchId || undefined;
    const { data: allForms = [] } = useBusinessForms({ branchId: resolvedBranchId });
    const { data: qrCodes = [] } = useQuery<any[]>({
        queryKey: ['qr-thrive-codes', resolvedBranchId],
        queryFn: async () => {
            if (!resolvedBranchId) return [];
            const response = await api.get(`/qr-thrive/branches/${resolvedBranchId}/qr-codes`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });
    const { data: rewards = [] } = useQuery<any[]>({
        queryKey: ['loyalty-rewards', resolvedBranchId],
        queryFn: async () => {
            if (!resolvedBranchId) return [];
            const response = await api.get(`/loyalty/rewards/branches/${resolvedBranchId}`);
            return response?.data || response || [];
        },
        enabled: !!resolvedBranchId
    });

    const previewBusinessName = activeBranch?.name || business?.name || 'Your Business';
    const previewBusinessLogo = business?.logoUrl || activeBranch?.logoUrl || '';

    const config = useMemo(() => getBusinessConfig(), [getBusinessConfig]);

    const previewUser = {
        firstName: 'Jamie',
        lastName: 'Lee',
        name: 'Jamie Lee',
        email: 'jamie@example.com',
        phone: '+1 555-010-2400',
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <PageHeader
                title="Customer Experience"
                description="Unify your physical touchpoints and digital engagement flow."
            />

            <div className="flex flex-col xl:flex-row gap-8 items-start xl:h-[calc(100vh-200px)]">
                {/* Left: Configuration Area */}
                <div className="flex-1 w-full space-y-6 xl:h-full xl:overflow-y-auto xl:pr-4 pb-20 custom-scrollbar">
                    {/* Step Navigation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {STEPS.map((step) => {
                            const Icon = step.icon;
                            const isActive = activeStep === step.id;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveStep(step.id as any)}
                                    className={cn(
                                        "flex flex-col items-start p-5 rounded-[2rem] border transition-all duration-300 text-left group",
                                        isActive 
                                            ? "bg-white border-primary shadow-xl shadow-primary/5 ring-1 ring-primary/20" 
                                            : "bg-white/50 border-gray-100 hover:bg-white hover:border-gray-200"
                                    )}
                                >
                                    <div className={cn(
                                        "size-10 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                                        isActive ? "bg-primary text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                                    )}>
                                        <Icon size={20} />
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "text-xs font-black uppercase tracking-widest mb-1",
                                            isActive ? "text-primary" : "text-gray-400"
                                        )}>{step.label}</p>
                                        <p className="text-xs font-medium text-gray-500">{step.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Step Content */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[600px] p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeStep === 'hardware' && <HardwareStep businessLogo={previewBusinessLogo} />}
                                {activeStep === 'content' && <ContentStep />}
                                {activeStep === 'sequence' && <SequenceStep branchId={activeBranchId || undefined} />}
                                {activeStep === 'appearance' && <AppearanceStep />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Independent Phone Preview */}
                <div className="w-full xl:w-[450px] xl:h-full xl:overflow-y-auto pb-20 custom-scrollbar">
                    <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-6 flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-6 px-2">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Live Journey Preview</p>
                            </div>
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                                {[
                                    { id: 'check-in', label: 'New' },
                                    { id: 'returning', label: 'Back' },
                                    { id: 'outcome', label: 'Goal' },
                                    { id: 'ubl', label: 'Menu' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setPreviewTab(tab.id as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                            previewTab === tab.id ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div style={brandVars} className="w-full flex justify-center">
                            <PhoneFrame title="Customer Journey">
                                <div className="h-full origin-top">
                                    {previewTab === 'check-in' && (
                                        <StepForm
                                            storeName={previewBusinessName}
                                            logoUrl={previewBusinessLogo}
                                            customWelcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                                            customWelcomeTitle={(engagementSettings as any)?.customWelcomeTitle || undefined}
                                            customWelcomeTag={(engagementSettings as any)?.customWelcomeTag || undefined}
                                            customPrivacyMessage={(engagementSettings as any)?.customPrivacyMessage || undefined}
                                            submitLabel={(engagementSettings as any)?.submitLabel || undefined}
                                            isPreview={true}
                                            onBack={() => {}}
                                            onSubmit={() => {}}
                                        />
                                    )}
                                    {previewTab === 'returning' && (
                                        <StepWelcomeBack
                                            storeName={previewBusinessName}
                                            userData={{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }}
                                            visitCount={3}
                                            rewardVisitThreshold={5}
                                            hasRewardSetup={hasRewardSetup}
                                            redemptionStatus="none"
                                            onRedeem={() => {}}
                                            onContinue={() => {}}
                                            onClear={() => {}}
                                            isPreview={true}
                                        />
                                    )}
                                    {previewTab === 'outcome' && (
                                        <StepOutcome
                                            config={config}
                                            hasRewardSetup={hasRewardSetup}
                                            isDownloading={false}
                                            onDownload={() => {}}
                                            onFinish={() => {}}
                                            onRestart={() => {}}
                                            engagementSettings={{ ...engagementSettings, isPreview: true }}
                                            isPreview={true}
                                        />
                                    )}
                                    {previewTab === 'ubl' && (
                                        <PortalWelcome
                                            branchName={previewBusinessName}
                                            logoUrl={previewBusinessLogo}
                                            welcomeMessage={(engagementSettings as any)?.customWelcomeMessage || undefined}
                                            onAction={() => {}}
                                            productCount={1}
                                            serviceCount={1}
                                            offerCount={1}
                                            formCount={1}
                                            engagement={engagementSettings}
                                            whatsappNumber={activeBranch?.whatsappNumber || business?.whatsappNumber || undefined}
                                            qrThriveCodes={qrCodes}
                                            availableForms={allForms}
                                            availableRewards={rewards}
                                            ublSequence={engagementSettings?.ublSequence}
                                            brandColor={brandColor}
                                            isPreview={true}
                                        />
                                    )}
                                </div>
                            </PhoneFrame>
                        </div>

                        <div className="mt-8 p-4 bg-gray-50 rounded-2xl border border-gray-100 w-full text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Settings2 size={12} className="text-primary" />
                                <p className="text-[10px] text-slate-900 font-black uppercase tracking-widest">Interactive Sandbox</p>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
                                Changes to your sequence and colors will update this preview <span className="text-primary">instantly</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
