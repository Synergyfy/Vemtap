'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, X as XIcon, Loader2, Info, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { rotatorApi } from '@/services/rotator/api';
import { STRATEGY_LABELS } from '@/services/rotator/types';
import type { DealEligibility, RotatorDeal, RotationConfig } from '@/services/rotator/types';

interface DealWhyModalProps {
    open: boolean;
    clusterId: string;
    deal: RotatorDeal | null;
    /** The cluster's live rotation config, used to explain strategy + weight. */
    config?: RotationConfig | null;
    onClose: () => void;
}

export default function DealWhyModal({ open, clusterId, deal, config, onClose }: DealWhyModalProps) {
    const [eligibility, setEligibility] = useState<DealEligibility | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !deal) return;
        let alive = true;
        rotatorApi.getEligibility(clusterId, deal.id)
            .then(res => { if (alive) setEligibility(res); })
            .catch(() => { if (alive) setEligibility(null); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [open, clusterId, deal]);

    if (!open || !deal) return null;

    const isEligible = eligibility?.eligible ?? false;
    const failedChecks = eligibility?.checks.filter(c => !c.passed) || [];

    // Real rotation facts, falling back to clear "default" phrasing when the
    // cluster is on automatic so nothing reads as a hardcoded value.
    const strategyMode = config?.rotation?.mode ?? 'automatic';
    const strategyLabel = strategyMode === 'manual'
        ? STRATEGY_LABELS[config!.rotation.strategy] ?? 'Manual'
        : 'Vemtap default';
    const isWeighted = strategyMode === 'manual' && config?.rotation?.strategy === 'weighted';
    const weightValue = isWeighted && deal
        ? config!.weights[deal.id] ?? 1
        : null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                >
                    <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-base text-text-main">{deal.name}</h3>
                            <p className="text-xs text-text-secondary font-medium mt-0.5">{deal.businessName}</p>
                        </div>
                        <button onClick={onClose} className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-5 overflow-y-auto">
                        {loading ? (
                            <div className="py-10 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                <Loader2 size={14} className="animate-spin" /> Checking eligibility…
                            </div>
                        ) : !eligibility ? (
                            <div className="py-10 text-center text-xs font-bold text-text-secondary">
                                Could not determine eligibility for this deal.
                            </div>
                        ) : (
                            <>
                                <div className={cn(
                                    "rounded-2xl p-4 border",
                                    isEligible ? "bg-emerald-50/60 border-emerald-100" : "bg-red-50/60 border-red-100"
                                )}>
                                    <p className={cn(
                                        "text-sm font-black flex items-center gap-2",
                                        isEligible ? "text-emerald-700" : "text-red-600"
                                    )}>
                                        {isEligible ? <Check size={16} /> : <XIcon size={16} />}
                                        {isEligible ? 'Why is this deal showing?' : "Why isn't this deal showing?"}
                                    </p>
                                    <p className="text-[11px] text-text-secondary mt-1 leading-snug">{eligibility.reason}</p>
                                </div>

                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-5 mb-2">Eligibility checks</p>
                                <div className="rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                    {eligibility.checks.map((c, i) => {
                                        const passed = c.passed;
                                        const relevant = !passed || isEligible;
                                        return (
                                            <div key={i} className={cn(
                                                "px-4 py-3 flex items-start gap-2.5",
                                                !passed ? "bg-red-50/40" : relevant ? "" : "opacity-40"
                                            )}>
                                                {passed ? (
                                                    <div className="mt-0.5 size-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <Check size={10} />
                                                    </div>
                                                ) : (
                                                    <div className="mt-0.5 size-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                                                        <XIcon size={10} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className={cn("text-[13px] font-bold", passed ? "text-text-main" : "text-red-600")}>{c.label}</p>
                                                    {c.detail && <p className="text-[11px] text-text-secondary mt-0.5">{c.detail}</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-5 mb-2">Rotation</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-xl border border-gray-100 p-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Strategy</p>
                                        <p className="text-sm font-bold text-text-main mt-1">
                                            {strategyMode === 'automatic' ? 'Automatic' : strategyLabel}
                                        </p>
                                        <p className="text-[10px] text-text-secondary mt-0.5">
                                            {strategyMode === 'automatic' ? 'Vemtap balances exposure' : 'Manually configured'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 p-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary">Weight</p>
                                        <p className="text-sm font-bold text-text-main mt-1">
                                            {weightValue != null ? `${weightValue}×` : 'Auto'}
                                        </p>
                                        <p className="text-[10px] text-text-secondary mt-0.5">
                                            {weightValue != null ? 'This deal weighs in' : 'Equal chance for all deals'}
                                        </p>
                                    </div>
                                </div>

                                {!isEligible && failedChecks.length > 0 && (
                                    <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-start gap-2">
                                        <Info size={13} className="text-gray-400 mt-0.5 shrink-0" />
                                        <p className="text-[11px] text-text-secondary leading-snug">
                                            Fixing the failed checks above will bring this deal back into rotation automatically.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 bg-gray-50/50">
                        <button onClick={onClose} className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-text-secondary hover:bg-gray-100 rounded-xl transition-all">
                            Close
                        </button>
                        {isEligible && (
                            <button className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-all">
                                <ExternalLink size={12} /> View deal
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}