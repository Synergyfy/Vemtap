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
    onDownload: () => void;
    onFinish: () => void;
    onRestart: () => void;
    onEngagement?: (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => void;
    engagementSettings?: any;
    socialLinks?: any;
    selectedFormTitle?: string | null;
    selectedFormType?: string | null;
    attachedForms?: Array<{ id: string; title: string; description?: string }>;
}

export const StepOutcome: React.FC<StepOutcomeProps> = ({
    config,
    customSuccessMessage,
    customRewardMessage,
    hasRewardSetup,
    isDownloading,
    onDownload,
    onFinish,
    onRestart,
    onEngagement,
    engagementSettings,
    socialLinks,
    selectedFormTitle,
    selectedFormType,
    attachedForms
}) => {
    const [isSocialModalOpen, setIsSocialModalOpen] = React.useState(false);

    const hasSocial = !!(engagementSettings?.instagram || engagementSettings?.linkedin || engagementSettings?.twitter || engagementSettings?.facebook || engagementSettings?.socialUrl);
    const hasReview = !!engagementSettings?.reviewUrl;
    const hasFeedback = !!engagementSettings?.showFeedback;
    const hasRewards = !!engagementSettings?.showRewards;

    const showEngagement = engagementSettings && (hasSocial || hasReview || hasFeedback || hasRewards);

    const handleEngagement = (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => {
        if (type === 'social') {
            setIsSocialModalOpen(true);
        }
        onEngagement?.(type, formId);
    };
    return (
        <motion.div key="outcome" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={presets.card}>
            <div className="flex flex-col items-center text-center">
                <div className="size-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h1 className={presets.title}>{customSuccessMessage || "Visit recorded successfully!"}</h1>
                <p className={`${presets.body} mt-4 mb-4`}>{config.outcomeDesc}</p>

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
                        selectedFormTitle={selectedFormTitle}
                        selectedFormType={selectedFormType}
                        attachedForms={attachedForms}
                    />
                )}

                <div className="w-full space-y-4 mt-8">
                    {!hasRewardSetup && (
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
