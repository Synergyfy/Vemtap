'use client';

import { Heart, MessageCircle, Bookmark, Share2, Loader2 } from 'lucide-react';
import { useEngagement, useSetReaction, useToggleSave } from '@/services/deals/engagement-hooks';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EngagementBarProps {
    offerId: string;
    offerTitle: string;
    offerDescription: string;
    dealUrl: string;
    onCommentClick?: () => void;
    businessName?: string;
    reviewCount?: number;
}

export default function EngagementBar({
    offerId,
    offerTitle,
    offerDescription,
    dealUrl,
    onCommentClick,
    businessName = 'Business',
}: EngagementBarProps) {
    const router = useRouter();
    const [showShare, setShowShare] = useState(false);

    const { data: engagement } = useEngagement(offerId);
    const setReaction = useSetReaction(offerId);
    const toggleSave = useToggleSave(offerId);

    const liked = engagement?.type === 'like';
    const saved = engagement?.isSaved ?? false;
    const likesCount = engagement?.likesCount ?? 0;
    const reviewsCount = engagement?.reviewsCount ?? 0;

    const handleLike = () => {
        setReaction.mutate('like');
    };

    const handleSave = () => {
        toggleSave.mutate();
    };

    const handleComment = () => {
        if (onCommentClick) {
            onCommentClick();
        } else {
            router.push(`/promotions/${offerId}/reviews`);
        }
    };

    return (
        <>
            <div className="flex items-center gap-2 flex-wrap">
                <AuthGuard onAction={handleLike} businessName={businessName}>
                    <button
                        disabled={setReaction.isPending}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            liked
                                ? 'bg-rose-50 text-rose-500 border border-rose-200'
                                : 'bg-gray-50 text-gray-500 hover:text-rose-500 hover:bg-rose-50 border border-transparent'
                        }`}
                    >
                        {setReaction.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                        )}
                        {likesCount > 0 ? likesCount : ''}
                        Like
                    </button>
                </AuthGuard>

                <button
                    onClick={handleComment}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent transition-colors"
                >
                    <MessageCircle size={14} />
                    {reviewsCount > 0 ? reviewsCount : ''}
                    Comment
                </button>

                <AuthGuard onAction={handleSave} businessName={businessName}>
                    <button
                        disabled={toggleSave.isPending}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                            saved
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-gray-50 text-gray-500 hover:text-primary hover:bg-primary/5 border border-transparent'
                        }`}
                    >
                        {toggleSave.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                        )}
                        Save
                    </button>
                </AuthGuard>

                <button
                    onClick={() => setShowShare(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent transition-colors"
                >
                    <Share2 size={14} />
                    Share
                </button>
            </div>

            <ShareDealModal
                isOpen={showShare}
                onClose={() => setShowShare(false)}
                title={offerTitle}
                description={offerDescription}
                url={dealUrl}
            />
        </>
    );
}
