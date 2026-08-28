'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, PenLine, Star, Loader2, ChevronDown } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ReviewCard from '@/components/deals/ReviewCard';
import WriteReviewModal from '@/components/deals/WriteReviewModal';
import { useReviews, useEngagement } from '@/services/deals/engagement-hooks';
import { usePublicOfferDetails } from '@/services/deals/hooks';

export default function PromotionReviewsPage() {
    const params = useParams();
    const router = useRouter();
    const offerId = params.id as string;

    const { data: offer, isLoading: offerLoading } = usePublicOfferDetails(offerId);
    const { data: engagement } = useEngagement(offerId);
    const [page, setPage] = useState(1);
    const { data: reviewsData, isLoading: reviewsLoading } = useReviews(offerId, page, 10);
    const [showWriteReview, setShowWriteReview] = useState(false);

    const promotionName = offer?.name || 'Deal';
    const reviews = reviewsData?.reviews || [];
    const totalCount = reviewsData?.total || 0;
    const totalPages = Math.ceil(totalCount / 10);

    if (offerLoading) {
        return (
            <div className="min-h-screen bg-[#f4f5f6] flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <p className="text-sm font-bold text-gray-400">Loading reviews...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f5f6] font-body text-text-main">
            <Navbar />

            <main className="pt-24 pb-20">
                <div className="max-w-2xl mx-auto px-4 md:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-primary text-sm font-bold transition-colors mb-4"
                        >
                            <ArrowLeft size={16} /> Back to deal
                        </button>

                        <div className="bg-white rounded-2xl p-6 border border-gray-100">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 mb-1">
                                        Reviews
                                    </h1>
                                    <p className="text-sm text-gray-500 font-medium">
                                        {promotionName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowWriteReview(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                                >
                                    <PenLine size={14} />
                                    Write Review
                                </button>
                            </div>

                            {totalCount > 0 && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                className="text-yellow-400 fill-yellow-400"
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">
                                        {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : totalCount === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-8 border border-gray-100 text-center"
                        >
                            <MessageCircle size={48} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="text-base font-bold text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-sm text-gray-500 font-medium mb-6">
                                Be the first to share your experience with this deal!
                            </p>
                            <button
                                onClick={() => setShowWriteReview(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                            >
                                <PenLine size={16} />
                                Write a Review
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {reviews.map((review, index) => (
                                    <motion.div
                                        key={review.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <ReviewCard review={review} offerId={offerId} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-8">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs font-bold text-gray-500 px-3">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <Footer />

            <WriteReviewModal
                isOpen={showWriteReview}
                onClose={() => setShowWriteReview(false)}
                offerId={offerId}
            />
        </div>
    );
}
