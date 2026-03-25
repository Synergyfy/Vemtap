'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, ShieldAlert, Clock3 } from 'lucide-react';

interface SuspensionReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => Promise<void>;
    title?: string;
    description?: string;
}

export default function SuspensionReasonModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Suspend Business Form",
    description = "Please provide a reason for suspending this form. This will be logged for audit purposes and may be shown to the merchant."
}: SuspensionReasonModalProps) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reason.trim());
            setReason('');
            onClose();
        } catch (error) {
            console.error('Suspension error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100">
                                    <ShieldAlert size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black text-text-main text-sm uppercase tracking-tight">
                                        {title}
                                    </h3>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                        Administrative Action Required
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                                <XCircle size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <p className="text-xs text-text-secondary font-medium leading-relaxed">
                                {description}
                            </p>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Suspension Reason</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Violation of terms, incomplete configuration, requested by merchant..."
                                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium text-sm outline-none focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-200 transition-all resize-none"
                                    rows={4}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim()}
                                    className="flex-2 h-11 px-8 bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isSubmitting ? <Clock3 size={16} className="animate-spin" /> : 'Confirm Suspension'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
