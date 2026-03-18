'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/dashboard/PageHeader';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { SocialLinksPreview } from '@/components/shared/SocialLinksPreview';
import { StepBusinessForm } from '@/components/visitor/StepBusinessForm';
import { StepForm } from '@/components/visitor/StepForm';
import { StepOutcome } from '@/components/visitor/StepOutcome';
import { StepFinalSuccess } from '@/components/visitor/StepFinalSuccess';
import { StepWelcomeBack } from '@/components/visitor/StepWelcomeBack';
import Spinner from '@/components/ui/Spinner';
import { useBusinessForms } from '@/services/business-forms/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useBranches } from '@/services/branches/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { buildBrandCssVars } from '@/lib/brandColor';

export default function SelectedFormPreviewPage() {
    const activeBranchId = useAuthStore((state) => state.activeBranchId);
    const userBranchId = useAuthStore((state) => state.user?.branchId);
    const {
        engagementSettings,
        getBusinessConfig,
        customSuccessMessage,
        customRewardMessage,
        customSuccessTitle,
        customSuccessTag,
        customSuccessButton,
        customWelcomeMessage,
        customWelcomeTitle,
        customWelcomeTag,
        customWelcomeButton,
        customPrivacyMessage,
        customNewUserWelcomeMessage,
        customNewUserWelcomeTitle,
        customNewUserWelcomeTag,
        customNewUserWelcomeButton,
        hasRewardSetup,
        rewardVisitThreshold,
        storeName,
        logoUrl,
    } = useCustomerFlowStore((state) => ({
        engagementSettings: state.engagementSettings,
        getBusinessConfig: state.getBusinessConfig,
        customSuccessMessage: state.customSuccessMessage,
        customRewardMessage: state.customRewardMessage,
        customSuccessTitle: state.customSuccessTitle,
        customSuccessTag: state.customSuccessTag,
        customSuccessButton: state.customSuccessButton,
        customWelcomeMessage: state.customWelcomeMessage,
        customWelcomeTitle: state.customWelcomeTitle,
        customWelcomeTag: state.customWelcomeTag,
        customWelcomeButton: state.customWelcomeButton,
        customPrivacyMessage: state.customPrivacyMessage,
        customNewUserWelcomeMessage: state.customNewUserWelcomeMessage,
        customNewUserWelcomeTitle: state.customNewUserWelcomeTitle,
        customNewUserWelcomeTag: state.customNewUserWelcomeTag,
        customNewUserWelcomeButton: state.customNewUserWelcomeButton,
        hasRewardSetup: state.hasRewardSetup,
        rewardVisitThreshold: state.rewardVisitThreshold,
        storeName: state.storeName,
        logoUrl: state.logoUrl,
    }));
    const { data: branches = [] } = useBranches();
    const { data: myBusiness } = useMyBusiness();
    const user = useAuthStore((state) => state.user);
    const mainBranch = myBusiness?.branches?.find((b) => b.isMainBranch);

    const branchScope = activeBranchId === 'all' ? null : (activeBranchId || userBranchId || null);
    const { data: forms = [], isLoading } = useBusinessForms({
        branchId: branchScope || userBranchId || branches[0]?.id || undefined,
        allBranches: !branchScope,
    });

    const [selectedFormId, setSelectedFormId] = useState<string>('');
    const [activePreviewTab, setActivePreviewTab] = useState<'form' | 'new_user' | 'thank_you' | 'final_step' | 'welcome_back' | 'preview'>('form');
    const [flowPreviewStep, setFlowPreviewStep] = useState<'form' | 'thank_you' | 'final_step' | 'welcome_back'>('form');

    useEffect(() => {
        if (activePreviewTab === 'preview') {
            setFlowPreviewStep('form');
        }
    }, [activePreviewTab]);

    useEffect(() => {
        if (!selectedFormId && forms.length > 0) {
            setSelectedFormId(forms[0]?.id || '');
        }
    }, [forms, selectedFormId]);

    const selectedForm = useMemo(
        () => forms.find((form) => form.id === selectedFormId) || null,
        [forms, selectedFormId]
    );

    const publicLink = useMemo(() => {
        if (!selectedForm?.uniqueCode) return '';
        if (typeof window === 'undefined') return `/forms/${selectedForm.uniqueCode}`;
        return `${window.location.origin}/forms/${selectedForm.uniqueCode}`;
    }, [selectedForm?.uniqueCode]);

    const config = useMemo(() => getBusinessConfig(), [getBusinessConfig]);
    const previewStoreName = myBusiness?.name || mainBranch?.name || user?.businessName || storeName || 'Your Store';
    const previewLogoUrl = myBusiness?.logoUrl || mainBranch?.logoUrl || user?.businessLogo || logoUrl || '';
    const brandVars = useMemo(
        () => buildBrandCssVars(engagementSettings.brandColor),
        [engagementSettings.brandColor]
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

    return (
        <div className="p-8 space-y-6">
            <PageHeader
                title="Selected Form Preview"
                description="Pick any form and preview it as customers would see it."
            />

            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest">Preview</span>
                <span>Selected Form</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href="/dashboard/settings/engagement/previews/default"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Default Form
                </Link>
                <Link
                    href="/dashboard/settings/engagement/previews/socials"
                    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                    Socials
                </Link>
                <span className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">Selected Form</span>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Spinner size="sm" />
                    Loading forms...
                </div>
            )}

            {!isLoading && forms.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-text-secondary">
                    No forms found. Create a form in the Form Creator first.
                </div>
            )}

            {!isLoading && forms.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Form Selector</p>
                                <h3 className="text-lg font-bold text-text-main mt-2">Choose a form</h3>
                            </div>
                            <select
                                value={selectedFormId}
                                onChange={(e) => setSelectedFormId(e.target.value)}
                                className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                            >
                                {forms.map((form) => (
                                    <option key={form.id} value={form.id}>
                                        {form.title || 'Untitled Form'}
                                    </option>
                                ))}
                            </select>

                            {selectedForm && (
                                <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Form Info</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedForm.title}</p>
                                    {selectedForm.description && (
                                        <p className="text-xs text-gray-500">{selectedForm.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        <Link
                                            href={`/dashboard/settings/engagement/forms?edit=${encodeURIComponent(selectedForm.id)}`}
                                            className="h-9 px-4 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest inline-flex items-center"
                                        >
                                            Edit Form
                                        </Link>
                                        {publicLink ? (
                                            <a
                                                href={publicLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest inline-flex items-center text-gray-600"
                                            >
                                                Open Public Link
                                            </a>
                                        ) : (
                                            <span className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest inline-flex items-center text-gray-300">
                                                Link Unavailable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sticky top-6">
                        <details open className="rounded-2xl border border-gray-100 bg-white">
                            <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                                Preview
                                <span className="text-[10px] font-semibold text-gray-400">Selected Form</span>
                            </summary>
                            <div className="px-4 pb-4">
                                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 mb-3">
                                    {[
                                        { key: 'form', label: 'Business Form' },
                                        { key: 'new_user', label: 'New User' },
                                        { key: 'thank_you', label: 'Thank You Page' },
                                        { key: 'final_step', label: 'Thank You Message' },
                                        { key: 'welcome_back', label: 'Welcome Back' },
                                        { key: 'preview', label: 'Preview' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActivePreviewTab(tab.key as typeof activePreviewTab)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                activePreviewTab === tab.key
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={brandVars}>
                                    <PhoneFrame title="Selected Form Preview">
                                        <div className="px-5 pb-8 pt-2">
                                            {selectedForm ? (
                                                <>
                                                    {activePreviewTab === 'form' && (
                                                        <>
                                                            <StepBusinessForm
                                                                form={{
                                                                    ...selectedForm,
                                                                    businessName: previewStoreName || selectedForm.businessName,
                                                                    businessLogo: previewLogoUrl || selectedForm.businessLogo,
                                                                }}
                                                                brandColor={engagementSettings.brandColor}
                                                                onComplete={() => setActivePreviewTab('thank_you')}
                                                                onSkip={() => { }}
                                                            />
                                                            <SocialLinksPreview settings={engagementSettings} />
                                                        </>
                                                    )}

                                                {activePreviewTab === 'new_user' && (
                                                    <StepForm
                                                        storeName={previewStoreName}
                                                        logoUrl={previewLogoUrl}
                                                        customWelcomeMessage={customNewUserWelcomeMessage}
                                                        customWelcomeTitle={customNewUserWelcomeTitle}
                                                        customWelcomeTag={customNewUserWelcomeTag}
                                                        customPrivacyMessage={customPrivacyMessage}
                                                        submitLabel={customNewUserWelcomeButton || 'Submit'}
                                                        initialData={previewUser}
                                                        onBack={() => setActivePreviewTab('form')}
                                                        onSubmit={() => setActivePreviewTab('thank_you')}
                                                    />
                                                )}

                                                {activePreviewTab === 'thank_you' && (
                                                    <StepOutcome
                                                        config={config}
                                                        customSuccessMessage={customSuccessMessage}
                                                        customRewardMessage={customRewardMessage}
                                                        hasRewardSetup={hasRewardSetup}
                                                        isDownloading={false}
                                                        onDownload={() => { }}
                                                        onFinish={() => setActivePreviewTab('final_step')}
                                                        onRestart={() => setActivePreviewTab('form')}
                                                        engagementSettings={engagementSettings}
                                                        selectedFormTitle={selectedForm.title || 'Selected Form'}
                                                        selectedFormType="Form"
                                                    />
                                                )}

                                                {activePreviewTab === 'final_step' && (
                                                    <StepFinalSuccess
                                                        customSuccessTag={customSuccessTag}
                                                        customSuccessTitle={customSuccessTitle}
                                                        finalSuccessMessage={customSuccessMessage}
                                                        customSuccessButton={customSuccessButton}
                                                        onFinish={() => setActivePreviewTab('welcome_back')}
                                                        engagementSettings={engagementSettings}
                                                    />
                                                )}

                                                {activePreviewTab === 'welcome_back' && (
                                                    <StepWelcomeBack
                                                        storeName={previewStoreName}
                                                        logoUrl={previewLogoUrl}
                                                        customWelcomeMessage={customWelcomeMessage}
                                                        customWelcomeTitle={customWelcomeTitle}
                                                        customWelcomeTag={customWelcomeTag}
                                                        customWelcomeButton={customWelcomeButton}
                                                        customPrivacyMessage={customPrivacyMessage}
                                                        userData={previewUser}
                                                        visitCount={Math.max(1, rewardVisitThreshold - 1)}
                                                        rewardVisitThreshold={rewardVisitThreshold}
                                                        hasRewardSetup={hasRewardSetup}
                                                        redemptionStatus="none"
                                                        showConsent
                                                        isCustomer
                                                        onRedeem={() => { }}
                                                        onContinue={() => { }}
                                                        onClear={() => { }}
                                                    />
                                                )}

                                                {activePreviewTab === 'preview' && (
                                                    <>
                                                        {flowPreviewStep === 'form' && (
                                                            <StepBusinessForm
                                                                form={{
                                                                    ...selectedForm,
                                                                    businessName: previewStoreName || selectedForm.businessName,
                                                                    businessLogo: previewLogoUrl || selectedForm.businessLogo,
                                                                }}
                                                                brandColor={engagementSettings.brandColor}
                                                                onComplete={() => setFlowPreviewStep('thank_you')}
                                                                onSkip={() => setFlowPreviewStep('thank_you')}
                                                            />
                                                        )}

                                                        {flowPreviewStep === 'thank_you' && (
                                                            <StepOutcome
                                                                config={config}
                                                                customSuccessMessage={customSuccessMessage}
                                                                customRewardMessage={customRewardMessage}
                                                                hasRewardSetup={hasRewardSetup}
                                                                isDownloading={false}
                                                                onDownload={() => { }}
                                                                onFinish={() => setFlowPreviewStep('final_step')}
                                                                onRestart={() => setFlowPreviewStep('form')}
                                                                engagementSettings={engagementSettings}
                                                                selectedFormTitle={selectedForm.title || 'Selected Form'}
                                                                selectedFormType="Form"
                                                            />
                                                        )}

                                                        {flowPreviewStep === 'final_step' && (
                                                            <StepFinalSuccess
                                                                customSuccessTag={customSuccessTag}
                                                                customSuccessTitle={customSuccessTitle}
                                                                finalSuccessMessage={customSuccessMessage}
                                                                customSuccessButton={customSuccessButton}
                                                                onFinish={() => setFlowPreviewStep('welcome_back')}
                                                                engagementSettings={engagementSettings}
                                                            />
                                                        )}

                                                        {flowPreviewStep === 'welcome_back' && (
                                                            <StepWelcomeBack
                                                                storeName={previewStoreName}
                                                                logoUrl={previewLogoUrl}
                                                                customWelcomeMessage={customWelcomeMessage}
                                                                customWelcomeTitle={customWelcomeTitle}
                                                                customWelcomeTag={customWelcomeTag}
                                                                customWelcomeButton={customWelcomeButton}
                                                                customPrivacyMessage={customPrivacyMessage}
                                                                userData={previewUser}
                                                                visitCount={Math.max(1, rewardVisitThreshold - 1)}
                                                                rewardVisitThreshold={rewardVisitThreshold}
                                                                hasRewardSetup={hasRewardSetup}
                                                                redemptionStatus="none"
                                                                showConsent
                                                                isCustomer
                                                                onRedeem={() => { }}
                                                                onContinue={() => setFlowPreviewStep('form')}
                                                                onClear={() => setFlowPreviewStep('form')}
                                                            />
                                                        )}
                                                    </>
                                                )}
                                            </>
                                            ) : (
                                                <div className="text-sm text-gray-500 p-6 text-center">
                                                    Select a form to preview.
                                                </div>
                                            )}
                                        </div>
                                    </PhoneFrame>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
}
