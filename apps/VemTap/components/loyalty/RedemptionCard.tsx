"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Clock, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Redemption, Reward } from '@/types/loyalty';
import { cn } from '@/lib/utils';

interface RedemptionCardProps {
    redemption: Redemption;
    reward: Reward;
    onClose: () => void;
    className?: string;
    method?: 'qr' | 'code';
}

export const RedemptionCard: React.FC<RedemptionCardProps> = ({ redemption, reward, onClose, className, method = 'qr' }) => {
    const timeLeft = Math.max(0, new Date(redemption.expiresAt).getTime() - Date.now());
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft / (1000 * 60)) % 60);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "bg-white w-full max-w-sm mx-auto overflow-hidden shadow-2xl border border-slate-100",
                className
            )}
        >
            <div className="bg-primary p-6 text-white text-center relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                    <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">Redemption Successful!</h3>
                <p className="text-white/80 text-sm font-medium">Present this code at the terminal</p>
            </div>

            <div className="p-8 text-center">
                {method === 'qr' ? (
                    <div className="mb-6 relative group inline-block mx-auto text-center">
                        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/10 transition-colors"></div>
                        <div className="relative bg-white p-4 rounded-xl border-4 border-slate-50 shadow-inner">
                            {/* QR Code Placeholder */}
                            <div className="w-48 h-48 bg-slate-50 flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                                <QrCode className="w-32 h-32 text-slate-800" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Staff to Scan</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 shadow-inner tracking-[0.2em]">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Unique 9-Digit Code</p>
                            <p className="text-4xl font-display font-black text-indigo-600 select-all">
                                {redemption.redemptionCode.replace(/\D/g, '').substring(0, 9).replace(/(\d{3})(?=\d)/g, '$1-') || "748-291-002"}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-3 italic">Show this to the cashier to type in.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="py-4 border-t border-b border-slate-50 flex items-center justify-center gap-6">

                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                            <span className="text-xs font-black text-emerald-600 px-3 py-1 bg-emerald-50 rounded-none border border-emerald-100 uppercase">
                                {redemption.status}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expires In</p>
                            <div className="flex items-center gap-1.5 text-xs font-black text-rose-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{hoursLeft}h {minutesLeft}m</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-left bg-slate-50 p-4 border border-slate-100 rounded-none">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reward Item</p>
                        <p className="font-bold text-slate-900 text-sm uppercase">{reward.name}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reward.description}</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                    <button className="h-12 bg-slate-100 text-slate-600 font-bold rounded-none hover:bg-slate-200 transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                        Apple Wallet
                        <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onClose}
                        className="h-12 bg-primary text-white font-bold rounded-none hover:bg-primary/90 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        Done
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
