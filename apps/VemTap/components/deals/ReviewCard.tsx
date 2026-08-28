'use client';

import { Heart } from 'lucide-react';
import { useToggleReviewLike } from '@/services/deals/engagement-hooks';
import AuthGuard from '@/components/auth/AuthGuard';
import type { DealReview } from '@/services/deals/types';

interface ReviewCardProps {
    review: DealReview;
    offerId: string;
}

function timeAgo(timestamp: string): string {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function ReviewCard({ review, offerId }: ReviewCardProps) {
    const toggleLike = useToggleReviewLike(offerId);

    const handleLike = () => {
        toggleLike.mutate(review.id);
    };

    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                            {review.reviewerName.charAt(0)}
                        </span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-900">{review.reviewerName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{timeAgo(review.createdAt)}</p>
                    </div>
                </div>

                <AuthGuard onAction={handleLike} businessName="Review">
                    <button
                        disabled={toggleLike.isPending}
                        className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                            review.isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'
                        }`}
                    >
                        <Heart size={12} fill={review.isLiked ? 'currentColor' : 'none'} />
                        {review.likesCount > 0 && review.likesCount}
                    </button>
                </AuthGuard>
            </div>

            <p className="text-sm text-gray-600 font-medium mt-3 leading-relaxed">
                {review.comment}
            </p>
        </div>
    );
}
