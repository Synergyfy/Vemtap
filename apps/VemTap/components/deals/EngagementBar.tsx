'use client';

import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { useDealEngagementStore } from '@/store/useDealEngagementStore';
import ShareDealModal from '@/components/promotions/ShareDealModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EngagementBarProps {
    offerId: string;
    offerTitle: string;
    offerDescription: string;
    dealUrl: string;
    reviewCount?: number;
    onCommentClick?: () => void;
}

export default function EngagementBar({
    offerId,
    offerTitle,
    offerDescription,
    dealUrl,
    reviewCount = 0,
    onCommentClick,
}: EngagementBarProps) {
    const router = useRouter();
    const [showShare, setShowShare] = useState(false);
    const { isDealLiked, isDealSaved, getDealLikeCount, toggleLikeDeal, toggleSaveDeal } =
        useDealEngagementStore();

    const liked = isDealLiked(offerId);
    const saved = isDealSaved(offerId);
    const likeCount = getDealLikeCount(offerId);

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
                <button
                    onClick={() => toggleLikeDeal(offerId)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        liked
                            ? 'bg-rose-50 text-rose-500 border border-rose-200'
                            : 'bg-gray-50 text-gray-500 hover:text-rose-500 hover:bg-rose-50 border border-transparent'
                    }`}
                >
                    <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                    {likeCount > 0 ? likeCount : ''}
                    Like
                </button>

                <button
                    onClick={handleComment}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent transition-colors"
                >
                    <MessageCircle size={14} />
                    {reviewCount > 0 ? reviewCount : ''}
                    Comment
                </button>

                <button
                    onClick={() => toggleSaveDeal(offerId)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        saved
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-gray-50 text-gray-500 hover:text-primary hover:bg-primary/5 border border-transparent'
                    }`}
                >
                    <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
                    Save
                </button>

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
