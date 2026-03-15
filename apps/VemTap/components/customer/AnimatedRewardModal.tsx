'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Gift, X } from 'lucide-react';

interface AnimatedRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    rewardName: string;
    rewardIcon?: React.ReactNode;
    points: number;
    redemptionCode?: string;
}

export default function AnimatedRewardModal({
    isOpen,
    onClose,
    rewardName,
    rewardIcon,
    points,
    redemptionCode
}: AnimatedRewardModalProps) {

    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            // Dynamically import confetti to avoid SSR issues
            import('canvas-confetti').then((confetti) => {
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                function randomInRange(min: number, max: number) {
                    return Math.random() * (max - min) + min;
                }

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);

                    confetti.default({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                    });
                    confetti.default({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                    });
                }, 250);

                return () => clearInterval(interval);
            });
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180, opacity: 0 }}
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={{ scale: 0, rotate: 180, opacity: 0 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-white rounded-lg p-8 max-w-md w-full shadow-2xl overflow-hidden"
                        >
                            {/* Animated background elements */}
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 180, 360],
                                    }}
                                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                    className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        rotate: [360, 180, 0],
                                    }}
                                    transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                                    className="absolute -bottom-20 -left-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"
                                />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
                            >
                                <X size={20} className="text-gray-400" />
                            </button>

                            {/* Content */}
                            <div className="relative z-10 text-center">
                                {/* Animated icon */}
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0],
                                    }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="mb-6 flex justify-center"
                                >
                                    <div className="relative">
                                        <div className="w-32 h-32 bg-linear-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border-4 border-white shadow-2xl">
                                            {rewardIcon || <Gift size={64} className="text-primary" />}
                                        </div>

                                        {/* Floating sparkles */}
                                        {[...Array(3)].map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    y: [-10, -30, -10],
                                                    x: [0, (i - 1) * 20, 0],
                                                    opacity: [0, 1, 0],
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 2,
                                                    delay: i * 0.3,
                                                }}
                                                className="absolute top-0 left-1/2"
                                            >
                                                <Sparkles size={20} className="text-yellow-400" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Success message */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h2 className="text-3xl font-display font-bold text-text-main mb-2">
                                        Congratulations! 🎉
                                    </h2>
                                    <p className="text-text-secondary mb-6">
                                        You've successfully redeemed your reward!
                                    </p>
                                </motion.div>

                                {/* Reward details */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="bg-linear-to-r from-primary/10 to-green-500/10 rounded-lg p-6 mb-6"
                                >
                                    <p className="text-sm font-bold text-text-secondary mb-2">YOUR REWARD</p>
                                    <h3 className="text-2xl font-display font-bold text-text-main mb-3">
                                        {rewardName}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 text-primary">
                                        <Star size={16} fill="currentColor" />
                                        <span className="font-black text-sm">{points} points redeemed</span>
                                    </div>
                                </motion.div>

                                {/* Instructions */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="bg-blue-50 rounded-lg p-4 mb-6"
                                >
                                    {redemptionCode ? (
                                        <div className="mb-2">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Your Code</p>
                                            <p className="text-2xl font-display font-black text-blue-900 tracking-[0.2em]">{redemptionCode.slice(0,3)}-{redemptionCode.slice(3,6)}-{redemptionCode.slice(6,9)}</p>
                                        </div>
                                    ) : null}
                                    <p className="text-xs text-blue-900 font-medium">
                                        📱 Show this code to the staff at the venue to claim your reward.
                                    </p>
                                </motion.div>

                                {/* Action button */}
                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    onClick={onClose}
                                    className="w-full h-12 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 active:scale-95"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Awesome!
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
