'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User } from 'lucide-react';
import { useDealEngagementStore } from '@/store/useDealEngagementStore';
import { toast } from 'react-hot-toast';

interface WriteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    offerId: string;
}

export default function WriteReviewModal({ isOpen, onClose, offerId }: WriteReviewModalProps) {
    const [name, setName] = useState('');
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addReview } = useDealEngagementStore();

    const handleSubmit = () => {
        if (!comment.trim()) {
            toast.error('Please write a comment');
            return;
        }

        setIsSubmitting(true);

        setTimeout(() => {
            addReview(offerId, {
                offerId,
                reviewerName: name.trim() || 'Anonymous',
                comment: comment.trim(),
            });

            toast.success('Review submitted!');
            setName('');
            setComment('');
            setIsSubmitting(false);
            onClose();
        }, 500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
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
                            <h3 className="text-base font-bold text-gray-900">Write a Review</h3>
                            <button
                                onClick={onClose}
                                className="size-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
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
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!comment.trim() || isSubmitting}
                            className="w-full h-12 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
