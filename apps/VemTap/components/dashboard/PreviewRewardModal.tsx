import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Download } from 'lucide-react';

interface PreviewRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    rewardTitle: string;
    businessName: string;
}

export default function PreviewRewardModal({
    isOpen,
    onClose,
    rewardTitle,
    businessName
}: PreviewRewardModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.9, rotate: 5 }}
                        transition={{ type: 'spring', duration: 0.6 }}
                        className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Gradient Header */}
                        <div className="bg-linear-to-br from-primary to-purple-600 p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                            <motion.div
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/10"
                            >
                                <Gift className="text-white w-10 h-10" strokeWidth={1.5} />
                            </motion.div>

                            <h3 className="text-white font-black text-2xl uppercase tracking-tight mb-1">Reward Unlocked!</h3>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Enjoy your gift from {businessName}</p>
                        </div>

                        {/* Body */}
                        <div className="p-8 text-center bg-white relative z-10">
                            <h2 className="text-3xl font-black text-slate-800 leading-tight mb-2 ">
                                "{rewardTitle}"
                            </h2>
                            <p className="text-slate-400 text-sm font-medium mb-8">
                                Present this screen to staff to redeem.
                            </p>

                            <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group">
                                <Download size={18} className="group-hover:-translate-y-1 transition-transform" />
                                Save to Wallet
                            </button>

                            <button
                                onClick={onClose}
                                className="mt-4 text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>

                        {/* Confetti (CSS-only approximation for now, or simple dots) */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ y: -20, x: Math.random() * 300, opacity: 1 }}
                                    animate={{ y: 500, rotate: 360 }}
                                    transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                                    className={`absolute w-3 h-3 rounded-full ${['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-purple-400'][i % 4]}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
