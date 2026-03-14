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
    selectedFormType,
    attachedForms = [],
    completedFormIds = [],
    settings = {}
}) => {
    const hasSocial = !!(settings.instagram || settings.twitter || settings.facebook || settings.linkedin || settings.socialUrl);
    const hasReview = !!settings.reviewUrl;
    const hasSelectedForm = !!selectedFormTitle;

    return (
        <div className="w-full space-y-3 mt-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left ml-1 mb-4">
                Boost Your Experience
            </h3>

            {attachedForms.length > 0 ? (
                attachedForms.map((form) => {
                    const isCompleted = completedFormIds.includes(form.id);
                    return (
                        <EngagementTile
                            key={form.id}
                            icon={isCompleted ? "check_circle" : "assignment"}
                            label={isCompleted ? `${form.title} (Redeemed)` : (form.title || 'Open Form')}
                            description={isCompleted ? "Thank you for filling this form!" : (form.description || 'Fill this form')}
                            color={isCompleted ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-600"}
                            onClick={() => !isCompleted && onAction('feedback', form.id)}
                        />
                    );
                })
            ) : (
                <>
                    {hasSelectedForm ? (
                        <EngagementTile
                            icon="assignment"
                            label={selectedFormTitle || 'Open Form'}
                            description={`Fill ${selectedFormType || 'selected'} form`}
                            color="bg-amber-50 text-amber-600"
                            onClick={() => onAction('feedback')}
                        />
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

                            {settings.showFeedback && (
                                <EngagementTile
                                    icon="chat_bubble"
                                    label="Quick Feedback"
                                    description="Help us improve our service"
                                    color="bg-purple-50 text-purple-500"
                                    onClick={() => onAction('feedback')}
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
