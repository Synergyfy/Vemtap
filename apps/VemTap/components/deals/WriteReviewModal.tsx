'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Loader2, CheckCircle2, Star, Clock } from 'lucide-react';
import { useCreateReview } from '@/services/deals/engagement-hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatConnectModal } from '@/components/visitor/ChatConnectModal';
import { toast } from 'react-hot-toast';
import type { DealReviewStatus } from '@/services/deals/types';

interface WriteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
    businessName?: string;
}

export default function WriteReviewModal({ isOpen, onClose, offerId, businessName = 'Business' }: WriteReviewModalProps) {
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [reviewStatus, setReviewStatus] = useState<DealReviewStatus>('approved');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const createReview = useCreateReview(offerId);
    const pendingSubmitRef = useRef(false);

    useEffect(() => {
        if (isAuthenticated && showAuthModal && pendingSubmitRef.current) {
            pendingSubmitRef.current = false;
            setShowAuthModal(false);
            toast.success('Signed in! Submitting your review...');
            setTimeout(() => submitReview(), 200);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, showAuthModal]);

    const submitReview = () => {
        if (!comment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        createReview.mutate(
            { comment: comment.trim(), name: name.trim() || undefined, rating: rating || undefined },
            {
                onSuccess: (response: any) => {
                    const status = response?.status || 'approved';
                    setReviewStatus(status);
                    setSubmitted(true);
                    setName('');
                    setComment('');
                    setRating(0);
                },
                onError: (err: any) => {
                    const msg = err?.message || '';
                    if (msg.toLowerCase().includes('already reviewed')) {
                        toast.error("You've already reviewed this deal");
                    } else if (msg.toLowerCase().includes('already submitted')) {
                        toast.error('A review from this device was already submitted in the last 24 hours');
                    } else {
                        toast.error(msg || 'Failed to submit review');
                    }
                },
            }
        );
    };

    const handleSubmit = () => {
        if (!isAuthenticated) {
            pendingSubmitRef.current = true;
            setShowAuthModal(true);
            return;
        }

        submitReview();
    };

    const handleClose = () => {
        setSubmitted(false);
        setReviewStatus('approved');
        setName('');
        setComment('');
        setRating(0);
        onClose();
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
                        onClick={handleClose}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-gray-900">
                                    {submitted ? 'Thank You!' : 'Write a Review'}
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                >
                                    <X size={16} className="text-gray-500" />
                                </button>
                            </div>

                            {submitted ? (
                                <div className="text-center py-6 space-y-4">
                                    <div className={`size-16 mx-auto rounded-full flex items-center justify-center ${
                                        reviewStatus === 'pending' ? 'bg-amber-50' : 'bg-green-50'
                                    }`}>
                                        {reviewStatus === 'pending' ? (
                                            <Clock size={32} className="text-amber-500" />
                                        ) : (
                                            <CheckCircle2 size={32} className="text-green-500" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {reviewStatus === 'pending' ? 'Review submitted!' : 'Review posted!'}
                                        </p>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {reviewStatus === 'pending'
                                                ? 'Your review has been submitted and is pending moderation. It will appear once approved.'
                                                : 'Your review has been posted successfully.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="w-full h-11 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {/* Star Rating */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-2 block">
                                                Rating (optional)
                                            </label>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onMouseEnter={() => setHoveredStar(star)}
                                                        onMouseLeave={() => setHoveredStar(0)}
                                                        onClick={() => setRating(star === rating ? 0 : star)}
                                                        className="p-0.5 transition-transform hover:scale-110"
                                                    >
                                                        <Star
                                                            size={28}
                                                            className={`transition-colors ${
                                                                star <= (hoveredStar || rating)
                                                                    ? 'text-amber-400 fill-amber-400'
                                                                    : 'text-gray-200'
                                                            }`}
                                                        />
                                                    </button>
                                                ))}
                                                {rating > 0 && (
                                                    <span className="text-xs font-bold text-gray-500 ml-2">
                                                        {rating}/5
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                                                Your name (optional)
                                            </label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Anonymous"
                                                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                                                Your review *
                                            </label>
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Share your experience with this deal..."
                                                rows={4}
                                                maxLength={1000}
                                                className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 text-right">
                                                {comment.length}/1000
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={!comment.trim() || createReview.isPending}
                                        className="w-full h-12 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {createReview.isPending ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        {createReview.isPending ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ChatConnectModal
                isOpen={showAuthModal}
                onClose={() => {
                    pendingSubmitRef.current = false;
                    setShowAuthModal(false);
                }}
                onSuccess={() => {}}
                storeName={businessName}
                signInTitle="Welcome Back"
                signInSubtitle="Sign in to submit your review."
                signUpTitle="Join VemTap"
                signUpSubtitle="Create an account to submit your review."
            />
        </>
    );
}
