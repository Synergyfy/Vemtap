'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { StepFinalSuccess } from '@/components/visitor/StepFinalSuccess';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import { buildBrandCssVars } from '@/lib/brandColor';

type UserFormSettingsMode = 'all' | 'default' | 'success';

interface UserFormSettingsPageProps {
    mode?: UserFormSettingsMode;
    defaultPreviewTab?: 'form' | 'thank_you' | 'final_step' | 'returning';
}

export default function UserFormSettingsView({
    mode = 'all',
    defaultPreviewTab = 'form',
}: UserFormSettingsPageProps) {
    const store = useCustomerFlowStore();
    const { data: business, isLoading } = useMyBusiness();
    const mainBranch = business?.branches?.find((b) => b.isMainBranch);
    const updateMutation = useUpdateBusiness();
    const [isSaving, setIsSaving] = useState(false);
    const [previewTab, setPreviewTab] = useState<'form' | 'thank_you' | 'final_step' | 'returning'>(defaultPreviewTab);

    const config = useMemo(() => store.getBusinessConfig(), [store]);
    const previewStoreName = mainBranch?.name || business?.name || store.storeName || 'Your Store';
    const previewLogoUrl = mainBranch?.logoUrl || business?.logoUrl || store.logoUrl;
    const previewHasRewards = mainBranch?.rewardEnabled ?? business?.rewardEnabled ?? store.hasRewardSetup;
    const brandVars = useMemo(
        () => buildBrandCssVars(store.engagementSettings.brandColor),
        [store.engagementSettings.brandColor]
    );
    const previewUser = useMemo(
        () => ({
            firstName: 'Jamie',
            lastName: 'Lee',
            name: 'Jamie Lee',
            email: 'jamie@example.com',
            phone: '+1 555-010-2400',
        }),
        []
    );

    const [settings, setSettings] = useState({
        welcomeTitle: store.customNewUserWelcomeTitle || 'Connect with us',
        welcomeMessage: store.customNewUserWelcomeMessage || 'Leave your details to stay in touch and earn rewards.',
        welcomeTag: store.customNewUserWelcomeTag || 'Quick Link',
        privacyMessage: store.customPrivacyMessage || 'I agree to have my visits securely tracked and data collected just for feedback and loyalty rewards.',
        submitLabel: store.customNewUserWelcomeButton || 'Submit',
        successTitle: store.customSuccessTitle || 'Visit recorded successfully!',
        successMessage: store.customSuccessMessage || 'Thank you for visiting our store',
    });

    useEffect(() => {
        if (!business) return;
        setSettings((prev) => ({
            ...prev,
            welcomeTitle: business.welcomeTitle || prev.welcomeTitle,
            welcomeMessage: business.welcomeMessage || prev.welcomeMessage,
            welcomeTag: business.welcomeTag || prev.welcomeTag,
            privacyMessage: business.privacyMessage || prev.privacyMessage,
            submitLabel: business.welcomeButton || prev.submitLabel,
            successTitle: business.successTitle || prev.successTitle,
            successMessage: business.successMessage || prev.successMessage,
        }));
    }, [business]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            store.updateCustomSettings({
                newUserWelcomeTitle: settings.welcomeTitle,
                newUserWelcomeMessage: settings.welcomeMessage,
                newUserWelcomeTag: settings.welcomeTag,
                newUserWelcomeButton: settings.submitLabel,
                privacyMessage: settings.privacyMessage,
                successTitle: settings.successTitle,
                successMessage: settings.successMessage,
            });

            if (business) {
                await updateMutation.mutateAsync({
                    id: business.id,
                    updates: {
                        welcomeTitle: settings.welcomeTitle,
                        welcomeMessage: settings.welcomeMessage,
                        welcomeTag: settings.welcomeTag,
                        welcomeButton: settings.submitLabel,
                        privacyMessage: settings.privacyMessage,
                        successTitle: settings.successTitle,
                        successMessage: settings.successMessage,
                    },
                });
            }

            toast.success('User form settings saved');
        } catch (error) {
            console.error('Failed to save user form settings', error);
            toast.error('Failed to save user form settings');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title={mode === 'success' ? 'Default success' : 'User experience'}
                description={
                    mode === 'success'
                        ? 'Set what visitors see immediately after submitting the default form.'
                        : 'Control the main form visitors fill before any post-submit actions.'
                }
            />
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Info size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">What is the Primary User Experience?</p>
                    <p className="text-xs text-gray-500 mt-1">
                        Configure the initial interaction every visitor has with your business. The default form identifies the customer before they move to social links or additional custom forms.
                    </p>
                </div>
            </div>

            <EngagementTabs
                tabs={[
                    { label: 'Appearance', href: '/dashboard/engagement/experience/appearance' },
                    { label: 'Default Form', href: '/dashboard/engagement/experience/default-form', active: mode === 'default' || mode === 'all' },
                    { label: 'Default Success', href: '/dashboard/engagement/experience/default-success', active: mode === 'success' },
                    { label: 'Additional Forms', href: '/dashboard/engagement/experience/additional-forms' },
                ]}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    {mode !== 'success' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Welcome Tag</label>
                                    <input
                                        type="text"
                                        value={settings.welcomeTag}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, welcomeTag: e.target.value }))}
                                        className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Welcome Title</label>
                                <input
                                    type="text"
                                    value={settings.welcomeTitle}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, welcomeTitle: e.target.value }))}
                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Welcome Message</label>
                                <textarea
                                    value={settings.welcomeMessage}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, welcomeMessage: e.target.value }))}
                                    className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="space-y-4 pt-2 pb-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Default Form Fields</label>
                                    <div className="group relative">
                                        <Info size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-medium">
                                            These core fields are required for business intelligence and loyalty tracking.
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Full Name', 'Phone Number', 'Email Address'].map((field) => (
                                        <div key={field} className="h-11 rounded-xl bg-gray-50 border border-gray-100 px-3 flex items-center justify-between opacity-60">
                                            <span className="text-xs font-bold text-gray-500">{field}</span>
                                            <div className="flex items-center gap-1.5 grayscale">
                                                <div className="size-1.5 rounded-full bg-gray-400"></div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Locked</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Privacy Message</label>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-1.5 rounded-full bg-amber-400"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Read Only</span>
                                    </div>
                                </div>
                                <textarea
                                    value={settings.privacyMessage}
                                    readOnly
                                    className="w-full min-h-[100px] rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-500 cursor-not-allowed resize-none"
                                />
                                <p className="text-[9px] text-gray-400 font-medium italic">Standard GDPR compliance text managed by VemTap.</p>
                            </div>
                        </div>
                    )}

                    {mode !== 'default' && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="size-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                                    <Save size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">After Submission Content</h3>
                                    <p className="text-[10px] text-gray-500">What visitors see after filling the default form.</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Success Title</label>
                                <input
                                    type="text"
                                    value={settings.successTitle}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, successTitle: e.target.value }))}
                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                    placeholder="e.g., Visit Recorded"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Success Description</label>
                                <textarea
                                    value={settings.successMessage}
                                    onChange={(e) => setSettings((prev) => ({ ...prev, successMessage: e.target.value }))}
                                    className="w-full min-h-[80px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    placeholder="e.g., Thank you for visiting our store"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="h-12 px-6 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Configuration
                        </button>
                    </div>
                </div>

                <div className="sticky top-6">
                    <details open className="rounded-2xl border border-gray-100 bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                            Preview
                            <span className="text-[10px] font-semibold text-gray-400">Data Form</span>
                        </summary>
                        <div className="px-4 pb-4">
                            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 mb-3">
                                {[
                                    { key: 'form', label: 'Welcome Form' },
                                    { key: 'thank_you', label: 'Thank You' },
                                    { key: 'returning', label: 'Returning User' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setPreviewTab(tab.key as typeof previewTab)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                            previewTab === tab.key
                                                ? 'bg-primary text-white'
                                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div style={brandVars}>
                                <PhoneFrame title="Live User Form Preview">
                                    <div className="p-6">
                                        {previewTab === 'form' && (
                                            <StepForm
                                                storeName={previewStoreName}
                                                logoUrl={previewLogoUrl}
                                                customWelcomeMessage={settings.welcomeMessage}
                                                customWelcomeTitle={settings.welcomeTitle}
                                                customWelcomeTag={settings.welcomeTag}
                                                customPrivacyMessage={settings.privacyMessage}
                                                submitLabel={settings.submitLabel || 'Submit'}
                                                onBack={() => { }}
                                                onSubmit={() => { }}
                                            />
                                        )}
                                    {previewTab === 'thank_you' && (
                                        <StepOutcome
                                            config={config}
                                            hasRewardSetup={previewHasRewards}
                                                isDownloading={false}
                                                onDownload={() => { }}
                                                onFinish={() => { }}
                                                onRestart={() => { }}
                                            customSuccessTitle={settings.successTitle}
                                            customSuccessDescription={settings.successMessage}
                                        />
                                    )}
                                    {previewTab === 'returning' && (
                                        <StepWelcomeBack
                                            storeName={previewStoreName}
                                                logoUrl={previewLogoUrl}
                                                userData={previewUser}
                                                visitCount={3}
                                                rewardVisitThreshold={5}
                                                hasRewardSetup={previewHasRewards}
                                                redemptionStatus="none"
                                                onRedeem={() => { }}
                                                onContinue={() => { }}
                                                onClear={() => { }}
                                            />
                                        )}
                                    </div>
                                </PhoneFrame>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
