'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import { PartyPopper, CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

export default function SuccessModal({ isOpen, onClose, title, message, actionLabel = "Go to Dashboard", onAction }: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            description=""
            size="sm"
        >
            <div className="py-8 text-center">
                <div className="relative inline-block mb-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                        className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center"
                    >
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="absolute -top-2 -right-2 p-2 bg-amber-400 text-white rounded-xl shadow-lg"
                    >
                        <Star size={20} fill="currentColor" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute -bottom-2 -left-2 p-2 bg-primary text-white rounded-xl shadow-lg"
                    >
                        <PartyPopper size={20} />
                    </motion.div>
                </div>

                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-2xl font-black text-slate-900 tracking-tight mb-2"
                >
                    {title}
                </motion.h3>
                
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed mb-8"
                >
                    {message}
                </motion.p>

                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={onAction || onClose}
                    className="w-full h-14 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20"
                >
                    {actionLabel}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </Modal>
    );
}
