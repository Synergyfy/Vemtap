'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import WriteReviewModal from '@/components/deals/WriteReviewModal';
import { useReviews } from '@/services/deals/engagement-hooks';
import { usePublicOfferDetails } from '@/services/deals/hooks';

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

export default function DealReviewsPage() {
    const params = useParams();
    const router = useRouter();
    const dealId = params.id as string;

    const { data: apiReviewsData, isLoading: apiLoading } = useReviews(dealId, 1, 50);
    const { data: offer } = usePublicOfferDetails(dealId);
    const [showWriteReview, setShowWriteReview] = useState(false);

    const businessName = offer?.business?.name || 'Business';
    const dealTitle = offer?.name || 'Deal';

    const reviews = apiReviewsData?.reviews || [];
    const totalReviews = apiReviewsData?.total || reviews.length;

    const averageRating = useMemo(() => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
        return sum / reviews.length;
    }, [reviews]);

    const ratingDistribution = useMemo(() => {
        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            const rating = r.rating || 0;
            if (rating >= 1 && rating <= 5) {
                dist[rating as keyof typeof dist]++;
            }
        });
        return dist;
    }, [reviews]);

    const getPercent = (count: number) => {
        if (totalReviews === 0) return 0;
        return Math.round((count / totalReviews) * 100);
    };

    const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClass = size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl';
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-symbols-outlined ${sizeClass} ${
                            star <= rating ? 'text-[#0055c4]' : 'text-[#c2c6d7]'
                        }`}
                        style={star <= rating ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
                    >
                        star
                    </span>
                ))}
            </div>
        );
    };

    if (apiLoading) {
        return (
            <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#0055c4]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] antialiased flex flex-col">
            {/* Top App Bar */}
            <header className="fixed top-0 w-full bg-[#f7f9fb] border-b border-[#c2c6d7] flex items-center justify-between px-5 h-[44px] z-50">
                <button
                    onClick={() => router.back()}
                    aria-label="Back"
                    className="w-10 h-10 flex items-center justify-center hover:bg-[#eceef0] transition-colors active:scale-95 rounded-full"
                >
                    <ArrowLeft size={20} className="text-[#0055c4]" />
                </button>
                <div className="flex flex-col items-center flex-1 min-w-0">
                    <h1 className="text-[16px] font-semibold text-[#191c1e] truncate max-w-[200px]">{dealTitle}</h1>
                    <span className="text-[12px] font-medium text-[#727786] truncate max-w-[200px]">{businessName}</span>
                </div>
                <div className="w-10 h-10" />
            </header>

            {/* Main Content */}
            <main className="flex-1 mt-[44px] pb-24 pt-4 px-5 flex flex-col gap-6 max-w-2xl mx-auto w-full">
                {/* Overall Rating Section */}
                <section className="bg-white rounded-xl p-6 border border-[#c2c6d7] shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <div className="text-[32px] leading-[40px] font-bold text-[#191c1e] flex items-baseline gap-2">
                            {averageRating.toFixed(1)}
                            <span className="text-[14px] font-semibold text-[#727786]">/ 5</span>
                        </div>
                        <div aria-label={`${averageRating.toFixed(1)} out of 5 stars`} className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`material-symbols-outlined text-2xl ${
                                        star <= Math.round(averageRating) ? 'text-[#0055c4]' : 'text-[#c2c6d7]'
                                    }`}
                                    style={star <= Math.round(averageRating) ? { fontVariationSettings: "'FILL' 1" } : { fontVariationSettings: "'FILL' 0" }}
                                >
                                    star
                                </span>
                            ))}
                        </div>
                        <p className="text-[14px] text-[#727786] mt-2">
                            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                        </p>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-2 border-t md:border-t-0 md:border-l border-[#c2c6d7] pt-4 md:pt-0 md:pl-6">
                        {[5, 4, 3, 2, 1].map((rating) => (
                            <div key={rating} className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-[#727786] w-4">{rating}</span>
                                <div className="h-2 bg-[#e6e8ea] rounded-full flex-1 overflow-hidden">
                                    <div
                                        className="h-full bg-[#0055c4] rounded-full transition-all duration-500"
                                        style={{ width: `${getPercent(ratingDistribution[rating as keyof typeof ratingDistribution])}%` }}
                                    />
                                </div>
                                <span className="text-[12px] font-medium text-[#727786] w-8 text-right">
                                    {getPercent(ratingDistribution[rating as keyof typeof ratingDistribution])}%
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Reviews List */}
                <section className="flex flex-col gap-4">
                    <h2 className="text-[20px] font-semibold text-[#191c1e]">Customer Reviews</h2>
                    <div className="flex flex-col gap-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-xl p-5 border border-[#c2c6d7] shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#d0e1fb] flex items-center justify-center text-[#0b1c30] text-[14px] font-semibold">
                                            {review.reviewerName.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-semibold text-[#191c1e]">{review.reviewerName}</span>
                                            <span className="text-[12px] font-medium text-[#727786]">{timeAgo(review.createdAt)}</span>
                                        </div>
                                    </div>
                                    {review.rating && review.rating > 0 && renderStars(review.rating, 'sm')}
                                </div>
                                <p className="text-[14px] text-[#191c1e] leading-relaxed">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Floating Write Review Button */}
            <div className="fixed bottom-0 left-0 w-full p-5 bg-[#f7f9fb] border-t border-[#c2c6d7] md:hidden z-40">
                <button
                    onClick={() => setShowWriteReview(true)}
                    className="w-full bg-[#0055c4] text-white text-[14px] font-semibold h-12 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
                >
                    <Edit size={18} />
                    Write a Review
                </button>
            </div>

            {/* Desktop Write Review Button */}
            <div className="hidden md:flex fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setShowWriteReview(true)}
                    className="bg-[#0055c4] text-white text-[14px] font-semibold h-12 px-6 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-[#0055c4]/20"
                >
                    <Edit size={18} />
                    Write a Review
                </button>
            </div>

            <WriteReviewModal
                isOpen={showWriteReview}
                onClose={() => setShowWriteReview(false)}
                offerId={dealId}
                businessName={businessName}
            />
        </div>
    );
}
