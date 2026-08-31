'use client';

import { useEngagement } from '@/services/deals/engagement-hooks';
import Link from 'next/link';
import { Loader2, Star } from 'lucide-react';

interface DealEngagementBadgeProps {
    offerId: string;
}

export default function DealEngagementBadge({ offerId }: DealEngagementBadgeProps) {
    const { data: engagement, isLoading } = useEngagement(offerId);

    if (isLoading) {
        return (
            <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                    <Loader2 size={10} className="animate-spin" />
                </div>
            </div>
        );
    }

    const likesCount = engagement?.likesCount ?? 0;
    const reviewsCount = engagement?.reviewsCount ?? 0;
    const averageRating = engagement?.averageRating;

    return (
        <div className="flex items-center gap-3 pt-1 border-t border-gray-50">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                <span className="text-rose-400">❤️</span>
                {likesCount}
            </div>
            {averageRating && averageRating > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    {averageRating.toFixed(1)}
                </div>
            )}
            <Link
                href={`/promotions/${offerId}#reviews`}
                className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-primary transition-colors"
            >
                <span>💬</span>
                {reviewsCount}
            </Link>
        </div>
    );
}
