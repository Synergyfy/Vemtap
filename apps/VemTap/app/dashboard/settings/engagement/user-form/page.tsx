'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Info, Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { SocialLinksPreview } from '@/components/shared/SocialLinksPreview';
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';

export default function UserFormSettingsPage() {
    const store = useCustomerFlowStore();
    const { data: business, isLoading } = useMyBusiness();
    const updateMutation = useUpdateBusiness();
    const [isSaving, setIsSaving] = useState(false);
    const [previewTab, setPreviewTab] = useState<'form' | 'thank_you' | 'returning'>('form');

    const config = useMemo(() => store.getBusinessConfig(), [store]);
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
                title="Default Form"
                description="Control the main form visitors fill before any post-submit actions."
            />
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Info size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">What is the Default Form?</p>
                    <p className="text-xs text-gray-500 mt-1">
                        This is the first form every customer sees. It collects basic details before any Additional Forms or Social actions.
                        Keep it short and clear to improve completion rates.
                    </p>
                </div>
            </div>

            <EngagementTabs
                tabs={[
                    { label: 'Socials', href: '/dashboard/settings/engagement/experience/socials' },
                    { label: 'Default Form', active: true },
                    { label: 'Additional Forms', href: '/dashboard/settings/engagement/experience/additional-forms' },
                ]}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
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

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Privacy Message</label>
                            <textarea
                                value={settings.privacyMessage}
                                onChange={(e) => setSettings((prev) => ({ ...prev, privacyMessage: e.target.value }))}
                                className="w-full min-h-[120px] rounded-xl border border-gray-200 px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Submit Button</label>
                            <input
                                type="text"
                                value={settings.submitLabel}
                                onChange={(e) => setSettings((prev) => ({ ...prev, submitLabel: e.target.value }))}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                placeholder="Submit"
                            />
                        </div>

                    </div>

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
                            <PhoneFrame title="Live User Form Preview">
                                <div className="p-6">
                                    {previewTab === 'form' && (
                                        <>
                                            <StepForm
                                                storeName={business?.name || store.storeName || 'Your Store'}
                                                logoUrl={business?.logoUrl || store.logoUrl}
                                                customWelcomeMessage={settings.welcomeMessage}
                                                customWelcomeTitle={settings.welcomeTitle}
                                                customWelcomeTag={settings.welcomeTag}
                                                customPrivacyMessage={settings.privacyMessage}
                                                submitLabel={settings.submitLabel || 'Submit'}
                                                headerVariant="inline"
                                                onBack={() => { }}
                                                onSubmit={() => { }}
                                            />
                                            <SocialLinksPreview settings={store.engagementSettings} />
                                        </>
                                    )}

                                    {previewTab === 'thank_you' && (
                                        <StepOutcome
                                            config={config}
                                            customSuccessMessage={store.customSuccessMessage}
                                            customRewardMessage={store.customRewardMessage}
                                            hasRewardSetup={store.hasRewardSetup}
                                            isDownloading={false}
                                            onDownload={() => { }}
                                            onFinish={() => setPreviewTab('returning')}
                                            onRestart={() => setPreviewTab('form')}
                                            engagementSettings={store.engagementSettings}
                                            selectedFormTitle="Default Form"
                                            selectedFormType="Form"
                                        />
                                    )}

                                    {previewTab === 'returning' && (
                                        <StepWelcomeBack
                                            storeName={business?.name || store.storeName || 'Your Store'}
                                            logoUrl={business?.logoUrl || store.logoUrl}
                                            customWelcomeMessage={store.customWelcomeMessage}
                                            customWelcomeTitle={store.customWelcomeTitle}
                                            customWelcomeTag={store.customWelcomeTag}
                                            customWelcomeButton={store.customWelcomeButton}
                                            customPrivacyMessage={store.customPrivacyMessage}
                                            userData={previewUser}
                                            visitCount={Math.max(1, store.rewardVisitThreshold - 1)}
                                            rewardVisitThreshold={store.rewardVisitThreshold}
                                            hasRewardSetup={store.hasRewardSetup}
                                            redemptionStatus="none"
                                            showConsent
                                            isCustomer
                                            onRedeem={() => { }}
                                            onContinue={() => setPreviewTab('form')}
                                            onClear={() => setPreviewTab('form')}
                                        />
                                    )}
                                </div>
                            </PhoneFrame>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
