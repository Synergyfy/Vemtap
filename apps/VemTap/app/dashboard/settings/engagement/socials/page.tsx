'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Facebook, Instagram, Linkedin, Loader2, Save, Trophy, Twitter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';
import PhoneFrame from '@/components/shared/PhoneFrame';
import { StepOutcome } from '@/components/visitor/StepOutcome';

const Toggle = ({ active, onChange }: { active: boolean; onChange: (val: boolean) => void }) => (
    <button
        onClick={() => onChange(!active)}
        className={`${active ? 'bg-primary' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20`}
    >
        <span className={`${active ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm`} />
    </button>
);

export default function EngagementSocialSettingsPage() {
    const { user, updateUser } = useAuthStore();
    const { engagementSettings, updateEngagementSettings, getBusinessConfig, customSuccessMessage, customRewardMessage, hasRewardSetup } = useCustomerFlowStore();
    const [isSaving, setIsSaving] = useState(false);
    const { data: business, isLoading } = useMyBusiness();
    const updateMutation = useUpdateBusiness();
    const config = getBusinessConfig();

    const [localSettings, setLocalSettings] = useState({
        reviewUrl: '',
        instagram: '',
        twitter: '',
        facebook: '',
        linkedin: '',
        showReview: true,
        showSocial: true,
        showFeedback: true,
    });

    useEffect(() => {
        if (business || user) {
            const profileFacebook = (user as any)?.facebookUrl || (user as any)?.businessFacebookUrl || '';
            const profileInstagram = (user as any)?.instagramUrl || (user as any)?.businessInstagramUrl || '';
            const profileX = (user as any)?.xUrl || (user as any)?.twitterUrl || '';
            const profileLinkedin = (user as any)?.linkedinUrl || (user as any)?.businessLinkedinUrl || '';

            setLocalSettings({
                reviewUrl: business?.reviewUrl || user?.engagement?.reviewUrl || '',
                instagram: business?.instagramUrl || profileInstagram || user?.engagement?.instagram || '',
                twitter: business?.xUrl || profileX || user?.engagement?.twitter || '',
                facebook: business?.facebookUrl || profileFacebook || user?.engagement?.facebook || '',
                linkedin: business?.linkedinUrl || profileLinkedin || user?.engagement?.linkedin || '',
                showReview: business?.showReview ?? user?.engagement?.showReview ?? true,
                showSocial: business?.showSocial ?? user?.engagement?.showSocial ?? true,
                showFeedback: business?.showFeedback ?? user?.engagement?.showFeedback ?? true,
            });
        }
    }, [business, user]);

    const hasAnySocial = Boolean(
        localSettings.instagram ||
        localSettings.facebook ||
        localSettings.twitter ||
        localSettings.linkedin
    );

    const showPreviewPlaceholders = localSettings.showSocial && !hasAnySocial;

    const previewEngagement = useMemo(() => ({
        showReview: localSettings.showReview,
        showSocial: localSettings.showSocial,
        showFeedback: localSettings.showFeedback,
        reviewUrl: localSettings.reviewUrl,
        socialUrl: localSettings.instagram || localSettings.facebook || localSettings.twitter || localSettings.linkedin || '',
        instagram: localSettings.instagram || (showPreviewPlaceholders ? 'https://instagram.com/your-handle' : ''),
        twitter: localSettings.twitter || (showPreviewPlaceholders ? 'https://x.com/your-handle' : ''),
        facebook: localSettings.facebook || (showPreviewPlaceholders ? 'https://facebook.com/your-page' : ''),
        linkedin: localSettings.linkedin || (showPreviewPlaceholders ? 'https://linkedin.com/company/your-company' : ''),
    }), [localSettings, showPreviewPlaceholders]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const engagementPayload = {
                reviewUrl: localSettings.reviewUrl,
                instagram: localSettings.instagram,
                twitter: localSettings.twitter,
                facebook: localSettings.facebook,
                linkedin: localSettings.linkedin,
                showReview: localSettings.showReview,
                showSocial: localSettings.showSocial,
                showFeedback: localSettings.showFeedback,
            };

            const { usersApi } = await import('@/lib/api/users');
            await usersApi.updateEngagement(engagementPayload);
            await updateUser({ engagement: engagementPayload });

            if (business) {
                await updateMutation.mutateAsync({
                    id: business.id,
                    updates: {
                        reviewUrl: localSettings.reviewUrl,
                        instagramUrl: localSettings.instagram,
                        xUrl: localSettings.twitter,
                        facebookUrl: localSettings.facebook,
                        linkedinUrl: localSettings.linkedin,
                        showReview: localSettings.showReview,
                        showSocial: localSettings.showSocial,
                        showFeedback: localSettings.showFeedback,
                    },
                });
            }

            updateEngagementSettings({
                ...engagementSettings,
                ...engagementPayload,
            });

            toast.success('Engagement settings updated successfully');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update settings');
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
                title="Social Engagement"
                description="Control social links and related post-submission actions."
            />

            <EngagementTabs
                tabs={[
                    { label: 'Socials', active: true },
                    { label: 'Default Form', href: '/dashboard/settings/engagement/experience/default-form' },
                    { label: 'Additional Forms', href: '/dashboard/settings/engagement/experience/additional-forms' },
                ]}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-display font-bold text-text-main">Show social links after default submission</h3>
                                <p className="text-xs text-text-secondary mt-1">
                                    When enabled, customers see a social links action in the step right after they submit the default form.
                                </p>
                            </div>
                            <Toggle
                                active={localSettings.showSocial}
                                onChange={(val) => setLocalSettings((prev) => ({ ...prev, showSocial: val }))}
                            />
                        </div>

                        {localSettings.showSocial && (
                            <div className="space-y-4">
                                <p className="text-xs text-text-secondary">
                                    Existing links from your business profile are auto-filled below. If none exist, add them here.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Instagram URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://instagram.com/your-handle"
                                            value={localSettings.instagram}
                                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, instagram: e.target.value }))}
                                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">X / Twitter URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://x.com/your-handle"
                                            value={localSettings.twitter}
                                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, twitter: e.target.value }))}
                                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Facebook URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://facebook.com/your-page"
                                            value={localSettings.facebook}
                                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, facebook: e.target.value }))}
                                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">LinkedIn URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://linkedin.com/company/your-company"
                                            value={localSettings.linkedin}
                                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, linkedin: e.target.value }))}
                                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="font-display font-bold text-text-main">Show review request</h3>
                                <p className="text-xs text-text-secondary mt-1">Enable Google/Trustpilot review prompt in post-submission flow.</p>
                            </div>
                            <Toggle
                                active={localSettings.showReview}
                                onChange={(val) => setLocalSettings((prev) => ({ ...prev, showReview: val }))}
                            />
                        </div>
                        <input
                            type="url"
                            placeholder="https://g.page/review/your-business"
                            value={localSettings.reviewUrl}
                            onChange={(e) => setLocalSettings((prev) => ({ ...prev, reviewUrl: e.target.value }))}
                            className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                        />

                        <div className="flex items-start justify-between gap-4 border-t border-gray-100 pt-4">
                            <div>
                                <h3 className="font-display font-bold text-text-main">Show quick feedback</h3>
                                <p className="text-xs text-text-secondary mt-1">Allow a quick feedback option in the same post-submission journey.</p>
                            </div>
                            <Toggle
                                active={localSettings.showFeedback}
                                onChange={(val) => setLocalSettings((prev) => ({ ...prev, showFeedback: val }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="sticky top-6 space-y-3">
                    <details open className="rounded-2xl border border-gray-100 bg-white">
                        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 flex items-center justify-between">
                            Preview
                            <span className="text-[10px] font-semibold text-gray-400">Social Links</span>
                        </summary>
                        <div className="px-4 pb-4 space-y-3">
                            {localSettings.showSocial ? (
                                <>
                                    <PhoneFrame title="Live Social Preview">
                                        <div className="p-6">
                                            <StepOutcome
                                                config={config}
                                                customSuccessMessage={customSuccessMessage}
                                                customRewardMessage={customRewardMessage}
                                                hasRewardSetup={hasRewardSetup}
                                                isDownloading={false}
                                                onDownload={() => { }}
                                                onFinish={() => { }}
                                                onRestart={() => { }}
                                                engagementSettings={previewEngagement}
                                                selectedFormTitle="Feedback Form"
                                                selectedFormType="Form"
                                            />
                                        </div>
                                    </PhoneFrame>
                                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Social Links Card</p>
                                        <div className="space-y-2 text-xs text-gray-700">
                                            {previewEngagement.instagram && (
                                                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100">
                                                    <Instagram size={16} className="text-pink-600" />
                                                    <span className="truncate">{previewEngagement.instagram}</span>
                                                </div>
                                            )}
                                            {previewEngagement.twitter && (
                                                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100">
                                                    <Twitter size={16} className="text-slate-900" />
                                                    <span className="truncate">{previewEngagement.twitter}</span>
                                                </div>
                                            )}
                                            {previewEngagement.facebook && (
                                                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100">
                                                    <Facebook size={16} className="text-blue-600" />
                                                    <span className="truncate">{previewEngagement.facebook}</span>
                                                </div>
                                            )}
                                            {previewEngagement.linkedin && (
                                                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 border border-gray-100">
                                                    <Linkedin size={16} className="text-blue-700" />
                                                    <span className="truncate">{previewEngagement.linkedin}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {showPreviewPlaceholders && (
                                        <p className="text-xs text-gray-500 text-center">
                                            Showing example social links until you add your own.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                                    Enable social links to see the user-step preview.
                                </div>
                            )}
                        </div>
                    </details>
                </div>
            </div>

            {/* Rewards Awareness */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-text-main">Reward Awareness</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Configure in Loyalty Settings</p>
                        </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter border border-emerald-100">Auto-managed</div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
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
    );
}
