import React from 'react';
import { motion } from 'framer-motion';
import { presets } from './presets';
import { EngagementTiles } from './EngagementTiles';
import { SocialMediaModal } from '@/components/ui/SocialMediaModal';

interface StepFinalSuccessProps {
    finalSuccessMessage?: string | null;
    customSuccessTitle?: string | null;
    customSuccessButton?: string | null;
    customSuccessTag?: string | null;
    onFinish: () => void;
    onEngagement?: (type: 'review' | 'social' | 'feedback' | 'rewards') => void;
    engagementSettings?: any;
    socialLinks?: any;
}

export const StepFinalSuccess: React.FC<StepFinalSuccessProps> = ({
    finalSuccessMessage,
    customSuccessTitle,
    customSuccessButton,
    customSuccessTag,
    onFinish,
    onEngagement,
    engagementSettings,
}) => {
    const [isSocialModalOpen, setIsSocialModalOpen] = React.useState(false);

    const hasSocial = !!(engagementSettings?.instagram || engagementSettings?.linkedin || engagementSettings?.twitter || engagementSettings?.facebook || engagementSettings?.socialUrl);
    const hasReview = !!engagementSettings?.reviewUrl;
    const hasFeedback = !!engagementSettings?.showFeedback;
    const hasRewards = !!engagementSettings?.showRewards;

    const showEngagement = engagementSettings && (hasSocial || hasReview || hasFeedback || hasRewards);

    const handleEngagement = (type: 'review' | 'social' | 'feedback' | 'rewards') => {
        if (type === 'social') {
            setIsSocialModalOpen(true);
        }
        onEngagement?.(type);
    };

    return (
        <motion.div key="final-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={presets.card + " text-center"}>
            <div className="size-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
            </div>
            {customSuccessTag && <span className={presets.tag + " mb-2 inline-block"}>{customSuccessTag}</span>}
            <h1 className={presets.title}>{customSuccessTitle || "Successfully Linked!"}</h1>
            <p className={presets.body + " mt-4 mb-8"}>
                {finalSuccessMessage || "Your profile has been successfully updated."}
            </p>

            {/* Prominent Google Review CTA */}
            {engagementSettings?.showReview && hasReview && (
                <div className="mb-6 p-1 bg-amber-50 rounded-3xl border border-amber-100">
                    <button
                        onClick={() => window.open(engagementSettings.reviewUrl, '_blank')}
                        className="w-full h-20 bg-white rounded-[1.4rem] shadow-sm border border-amber-200/50 flex items-center justify-between px-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="size-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined !text-2xl">star</span>
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-slate-900 leading-tight">Rate us on Google</h4>
                                <p className="text-[10px] font-bold text-amber-600 mt-0.5">TAP TO LEAVE A 5-STAR REVIEW</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-amber-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            )}

            {/* Engagement Layer preserved in final step */}
            {showEngagement && (
                <div className="mb-8">
                    <EngagementTiles
                        onAction={handleEngagement}
                        settings={engagementSettings}
                    />
                </div>
            )}

            <button onClick={onFinish} className={presets.secondaryButton}>
                {customSuccessButton || "Finish Process"}
            </button>

            <SocialMediaModal
                isOpen={isSocialModalOpen}
                onClose={() => setIsSocialModalOpen(false)}
                socialLinks={engagementSettings}
            />
        </motion.div>
    );
};
