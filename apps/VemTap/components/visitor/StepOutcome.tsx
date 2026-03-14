import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { EngagementTiles } from './EngagementTiles';
import { SocialMediaModal } from '@/components/ui/SocialMediaModal';

interface StepOutcomeProps {
    config: any;
    customSuccessMessage?: string | null;
    customRewardMessage?: string | null;
    hasRewardSetup: boolean;
    isDownloading: boolean;
    isFormsLoading?: boolean;
    onDownload: () => void;
    onFinish: () => void;
    onRestart: () => void;
    onEngagement?: (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => void;
    engagementSettings?: any;
    socialLinks?: any;
    attachedForms?: Array<{ id: string; title: string; description?: string }>;
    completedFormIds?: string[];
    customSuccessTitle?: string | null;
    customSuccessDescription?: string | null;
    selectedFormTitle?: string | null;
    selectedFormType?: string | null;
}

export const StepOutcome: React.FC<StepOutcomeProps> = ({
    config,
    customSuccessMessage,
    customRewardMessage,
    hasRewardSetup,
    isDownloading,
    isFormsLoading = false,
    onDownload,
    onFinish,
    onRestart,
    onEngagement,
    engagementSettings,
    socialLinks,
    attachedForms,
    completedFormIds = [],
    customSuccessTitle,
    customSuccessDescription
}) => {
    const [isSocialModalOpen, setIsSocialModalOpen] = React.useState(false);

    const hasSocial = !!(engagementSettings?.instagram || engagementSettings?.linkedin || engagementSettings?.twitter || engagementSettings?.facebook || engagementSettings?.socialUrl || engagementSettings?.reviewUrl || engagementSettings?.trustpilotUrl);
    const hasReview = !!engagementSettings?.reviewUrl;
    const hasFeedback = !!engagementSettings?.showFeedback;
    const hasRewards = !!engagementSettings?.showRewards;

    const showEngagement = engagementSettings && (hasSocial || hasReview || hasFeedback || hasRewards || attachedForms?.length);

    const socialItems: Array<{ label: string; url?: string }> = [
        { label: 'Instagram', url: engagementSettings?.instagram },
        { label: 'X / Twitter', url: engagementSettings?.twitter },
        { label: 'Facebook', url: engagementSettings?.facebook },
        { label: 'LinkedIn', url: engagementSettings?.linkedin },
        { label: 'Google Review', url: engagementSettings?.reviewUrl },
        { label: 'Trustpilot', url: engagementSettings?.trustpilotUrl },
    ];
    const hasExplicitSocial = socialItems.some((link) => Boolean(link.url));
    const fallbackSocialUrl = !hasExplicitSocial ? engagementSettings?.socialUrl : '';
    const showSocialCard = !!(engagementSettings?.showSocial && (hasExplicitSocial || fallbackSocialUrl));

    const handleEngagement = (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => {
        if (type === 'social') {
            setIsSocialModalOpen(true);
        }
        onEngagement?.(type, formId);
    };

    const allFormsCompleted = attachedForms && attachedForms.length > 0 && attachedForms.every(f => completedFormIds.includes(f.id));

    return (
        <motion.div key="outcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={presets.card}>
            <div className="flex flex-col items-center text-center">
                {(attachedForms && attachedForms.length > 0) ? (
                    <div className="mb-6">
                        <h1 className="text-xl font-black text-slate-900 leading-tight">Post-Submission</h1>
                        <p className="text-xs text-slate-500 mt-2">Finish these quick forms to complete your visit.</p>
                    </div>
                ) : (
                    <>
                        <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <span className="material-symbols-outlined text-4xl">check_circle</span>
                        </div>
                        <h1 className={presets.title}>{customSuccessTitle || "Visit Recorded"}</h1>
                        <p className={`${presets.body} mt-4 mb-4`}>{customSuccessDescription || customSuccessMessage || "Thank you for visiting our store"}</p>
                    </>
                )}

                {hasRewardSetup && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="w-full bg-linear-to-br from-primary to-primary-dark rounded-2xl p-8 text-white relative overflow-hidden mb-8 text-left shadow-2xl shadow-primary/20"
                    >
                        <div className="z-10 relative">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Your Reward</p>
                            <h3 className="text-2xl font-black  mb-8 tracking-tighter">
                                {customRewardMessage || "Access Granted"}
                            </h3>
                            <button
                                onClick={onDownload}
                                disabled={isDownloading}
                                className="w-full h-12 bg-white text-primary font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all font-sans"
                            >
                                {isDownloading ? <span className="animate-spin material-symbols-outlined text-sm">sync</span> : <span className="material-symbols-outlined text-sm">file_download</span>}
                                {isDownloading ? 'Processing...' : 'Save Reward to Phone'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Engagement Layer */}
                {showEngagement && (
                    <EngagementTiles
                        onAction={handleEngagement}
                        settings={engagementSettings}
                        attachedForms={attachedForms}
                        completedFormIds={completedFormIds}
                    />
                )}

                {showSocialCard && (
                    <div className="w-full mt-6 rounded-2xl border border-gray-100 bg-white p-4 text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Social Links</p>
                        <div className="space-y-2 text-xs text-slate-700">
                            {socialItems.map((link) => (
                                link.url ? (
                                    <div key={link.label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                                        <span className="font-semibold">{link.label}</span>
                                        <span className="truncate text-slate-500">{link.url}</span>
                                    </div>
                                ) : null
                            ))}
                            {fallbackSocialUrl && (
                                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="font-semibold">Social Link</span>
                                    <span className="truncate text-slate-500">{fallbackSocialUrl}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="w-full space-y-4 mt-8">
                    {allFormsCompleted && (
                        <button onClick={onFinish} className={presets.button}>Complete Visit</button>
                    )}
                    {!hasRewardSetup && !allFormsCompleted && (
                        <button onClick={onFinish} className={presets.button}>Finish</button>
                    )}
                    <button onClick={onRestart} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-red-400 transition-colors">Return to Start</button>
                </div>

                <SocialMediaModal
                    isOpen={isSocialModalOpen}
                    onClose={() => setIsSocialModalOpen(false)}
                    socialLinks={engagementSettings}
                />
            </div>
        </motion.div>
    );
};
