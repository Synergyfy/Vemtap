import React from 'react';
import { motion } from 'framer-motion';

import Spinner from '@/components/ui/Spinner';

interface EngagementTileProps {
    icon: string;
    label: string;
    description: string;
    onClick: () => void;
    color: string;
}

const EngagementTile: React.FC<EngagementTileProps> = ({ icon, label, description, onClick, color }) => (
    <motion.button
        whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.02)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="w-full p-4 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all text-left group"
    >
        <div className={`size-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-black text-slate-900 leading-tight">{label}</h4>
            <p className="text-[10px] font-medium text-slate-500 mt-0.5">{description}</p>
        </div>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">arrow_forward_ios</span>
    </motion.button>
);

interface EngagementTilesProps {
    onAction: (type: 'review' | 'social' | 'feedback' | 'rewards', formId?: string) => void;
    selectedFormTitle?: string | null;
    selectedFormType?: string | null;
    attachedForms?: Array<{ id: string; title: string; description?: string }>;
    completedFormIds?: string[];
    settings?: {
        showReview?: boolean;
        showSocial?: boolean;
        showFeedback?: boolean;
        showRewards?: boolean;
        reviewUrl?: string;
        instagram?: string;
        twitter?: string;
        facebook?: string;
        linkedin?: string;
        socialUrl?: string;
    };
}

export const EngagementTiles: React.FC<EngagementTilesProps> = ({
    onAction,
    selectedFormTitle,
    attachedForms = [],
    completedFormIds = [],
    settings = {}
}) => {
    const hasSocial = !!(settings.instagram || settings.twitter || settings.facebook || settings.linkedin || settings.socialUrl);
    const hasReview = !!settings.reviewUrl;
    const hasSelectedForm = !!selectedFormTitle;
    const formButtonBase = "w-full h-11 rounded-xl border px-4 text-left text-sm font-semibold flex items-center justify-between transition-all";

    return (
        <div className="w-full space-y-3 mt-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left ml-1 mb-4">
                Boost Your Experience
            </h3>

            {attachedForms.length > 0 ? (
                <div className="space-y-2">
                    {attachedForms.map((form) => {
                        const isCompleted = completedFormIds.includes(form.id);
                        return (
                            <button
                                key={form.id}
                                onClick={() => !isCompleted && onAction('feedback', form.id)}
                                disabled={isCompleted}
                                className={`${formButtonBase} ${
                                    isCompleted
                                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700 cursor-default'
                                        : 'bg-white border-gray-200 text-slate-900 hover:bg-gray-50'
                                }`}
                            >
                                <span className="truncate">{form.title || 'Open Form'}</span>
                                <span className="material-symbols-outlined text-base text-slate-300">arrow_forward</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <>
                    {hasSelectedForm ? (
                        <button
                            onClick={() => onAction('feedback')}
                            className={`${formButtonBase} bg-white border-gray-200 text-slate-900 hover:bg-gray-50`}
                        >
                            <span className="truncate">{selectedFormTitle || 'Open Form'}</span>
                            <span className="material-symbols-outlined text-base text-slate-300">arrow_forward</span>
                        </button>
                    ) : (
                        <>
                            {settings.showReview && hasReview && (
                                <EngagementTile
                                    icon="star"
                                    label="Leave a Review"
                                    description="Share your experience on Google"
                                    color="bg-amber-50 text-amber-500"
                                    onClick={() => onAction('review')}
                                />
                            )}

                            {settings.showSocial && hasSocial && (
                                <EngagementTile
                                    icon="share"
                                    label="Show Social Links"
                                    description="Open social links after default submission"
                                    color="bg-blue-50 text-blue-500"
                                    onClick={() => onAction('social')}
                                />
                            )}

                            {settings.showRewards && (
                                <EngagementTile
                                    icon="redeem"
                                    label="Claim Rewards"
                                    description="Unlock exclusive benefits"
                                    color="bg-emerald-50 text-emerald-500"
                                    onClick={() => onAction('rewards')}
                                />
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};
