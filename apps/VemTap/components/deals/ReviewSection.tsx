'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useReviewPreview } from '@/services/deals/engagement-hooks';
import ReviewCard from './ReviewCard';

interface ReviewSectionProps {
    offerId: string;
    dealUrl?: string;
    businessSlug?: string;
    businessName?: string;
    onWriteReview?: () => void;
}

export default function ReviewSection({
    offerId,
    dealUrl,
    businessSlug,
    businessName = 'Business',
    onWriteReview,
}: ReviewSectionProps) {
    const { data, isLoading } = useReviewPreview(offerId);
    const reviews = data?.reviews || [];

    const reviewsHref = dealUrl
        ? `${dealUrl}/reviews`
        : `/deals/${businessSlug || 'b'}/${offerId}/reviews`;

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle size={18} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">Reviews</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <MessageCircle size={18} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900">Reviews</h3>
                </div>
                <p className="text-xs text-gray-400 font-medium text-center py-4">
                    No reviews yet. Be the first to share your experience!
                </p>
                {onWriteReview ? (
                    <button
                        type="button"
                        onClick={onWriteReview}
                        className="block w-full text-center text-xs font-bold text-primary hover:text-primary/80 mt-2"
                    >
                        Write a review
                    </button>
                ) : (
                    <Link
                        href={reviewsHref}
                        className="block text-center text-xs font-bold text-primary hover:text-primary/80 mt-2"
                    >
                        Write a review
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MessageCircle size={18} className="text-gray-900" />
                    <h3 className="text-sm font-bold text-gray-900">What people are saying</h3>
                </div>
                <div className="flex items-center gap-3">
                    {onWriteReview && (
                        <button
                            type="button"
                            onClick={onWriteReview}
                            className="text-xs font-bold text-primary hover:text-primary/80"
                        >
                            Write review
                        </button>
                    )}
                    <Link
                        href={reviewsHref}
                        className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                        See all
                    </Link>
                </div>
            </div>

            <div className="space-y-3">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} offerId={offerId} />
                ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                {onWriteReview && (
                    <button
                        type="button"
                        onClick={onWriteReview}
                        className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                        Write a review
                    </button>
                )}
                <Link
                    href={reviewsHref}
                    className="text-xs font-bold text-primary hover:text-primary/80 ml-auto"
                >
                    See all reviews →
                </Link>
            </div>
        </div>
    );
}
