'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { SocialLinksPreview } from '@/components/shared/SocialLinksPreview';
import { StepForm } from '@/components/visitor/StepForm';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';

export default function DefaultFormPreviewPage() {
    const store = useCustomerFlowStore();
    const { data: business, isLoading } = useMyBusiness();
    const updateMutation = useUpdateBusiness();
    const [isSaving, setIsSaving] = useState(false);
    const [submitLabel, setSubmitLabel] = useState(store.customNewUserWelcomeButton || 'Submit');

    useEffect(() => {
        if (!business?.welcomeButton) return;
        setSubmitLabel(business.welcomeButton);
    }, [business?.welcomeButton]);

    const previewSettings = useMemo(() => ({
        welcomeTitle: business?.welcomeTitle || store.customNewUserWelcomeTitle || 'Connect with us',
        welcomeMessage:
            business?.welcomeMessage ||
            store.customNewUserWelcomeMessage ||
            'Leave your details to stay in touch and earn rewards.',
        welcomeTag: business?.welcomeTag || store.customNewUserWelcomeTag || 'Quick Link',
        privacyMessage:
            business?.privacyMessage ||
            store.customPrivacyMessage ||
            'I agree to have my visits securely tracked and data collected just for feedback and loyalty rewards.',
        submitLabel:
            submitLabel ||
            business?.welcomeButton ||
            store.customNewUserWelcomeButton ||
            'Submit',
        logoUrl: business?.logoUrl || store.logoUrl || '',
    }), [
        business?.logoUrl,
        business?.privacyMessage,
        business?.welcomeButton,
        business?.welcomeMessage,
        business?.welcomeTag,
        business?.welcomeTitle,
        store.customNewUserWelcomeButton,
        store.customNewUserWelcomeMessage,
        store.customNewUserWelcomeTag,
        store.customNewUserWelcomeTitle,
        store.customPrivacyMessage,
        store.logoUrl,
        submitLabel,
    ]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            store.updateCustomSettings({
                newUserWelcomeButton: submitLabel,
            });

            if (business) {
                await updateMutation.mutateAsync({
                    id: business.id,
                    updates: {
                        welcomeButton: submitLabel,
                    },
                });
            }

            toast.success('Submit button updated');
        } catch (error) {
            console.error('Failed to update submit button', error);
            toast.error('Failed to update submit button');
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
                title="Default Form Preview"
                description="Preview the default customer form and adjust the submit button."
            />

            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">Preview</span>
                <span>Default Form</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">Default Form</span>
                <Link
                    href="/dashboard/settings/engagement/previews/socials"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Socials
                </Link>
                <Link
                    href="/dashboard/settings/engagement/previews/forms"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Selected Form
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Quick Edit</p>
                                <h3 className="text-lg font-bold text-text-main mt-2">Submit Button</h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    Change the call-to-action label for the default visitor form.
                                </p>
                            </div>
                            <Link
                                href="/dashboard/settings/engagement/user-form"
                                className="px-3 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                            >
                                Full Settings
                            </Link>
                        </div>
                        <input
                            value={submitLabel}
                            onChange={(e) => setSubmitLabel(e.target.value)}
                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            placeholder="Submit"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="h-11 px-5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-60"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sticky top-6">
                    <details open className="rounded-2xl border border-gray-100 bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                            Preview
                            <span className="text-[10px] font-semibold text-gray-400">Default Form</span>
                        </summary>
                        <div className="px-4 pb-4">
                            <PhoneFrame title="Default Form Preview">
                                <div className="p-6">
                                    <StepForm
                                        storeName={business?.name || store.storeName || 'Your Store'}
                                        logoUrl={previewSettings.logoUrl}
                                        customWelcomeMessage={previewSettings.welcomeMessage}
                                        customWelcomeTitle={previewSettings.welcomeTitle}
                                        customWelcomeTag={previewSettings.welcomeTag}
                                        customPrivacyMessage={previewSettings.privacyMessage}
                                        submitLabel={previewSettings.submitLabel}
                                        headerVariant="inline"
                                        onBack={() => { }}
                                        onSubmit={() => { }}
                                    />
                                    <SocialLinksPreview settings={store.engagementSettings} />
                                </div>
                            </PhoneFrame>
                        </div>
                    </details>
                </div>
            </div>
        </div>
    );
}
