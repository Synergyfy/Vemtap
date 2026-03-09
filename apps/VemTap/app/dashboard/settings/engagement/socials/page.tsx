'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/engagement/EngagementTabs';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness, useUpdateBusiness } from '@/services/businesses/hooks';

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
    const { engagementSettings, updateEngagementSettings } = useCustomerFlowStore();
    const [isSaving, setIsSaving] = useState(false);
    const { data: business, isLoading } = useMyBusiness();
    const updateMutation = useUpdateBusiness();

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
                    { label: 'Form Creator', href: '/dashboard/settings/engagement/forms' },
                    { label: 'Form Responses', href: '/dashboard/settings/engagement/forms/responses' },
                ]}
            />

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
