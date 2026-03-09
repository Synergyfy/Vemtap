'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/dashboard/PageHeader';
import EngagementTabs from '@/components/dashboard/settings/EngagementTabs';
import Toggle from '@/components/ui/Toggle';

export default function SocialEngagementPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [localSettings, setLocalSettings] = useState({
        showSocial: true,
        instagram: '',
        twitter: '',
        facebook: '',
        linkedin: '',
        showReview: true,
        reviewUrl: '',
        showFeedback: true,
    });

    useEffect(() => {
        // Mock fetch
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success('Settings updated successfully');
        } catch (error) {
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
                    { label: 'Overview', href: '/dashboard/settings/engagement' },
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
