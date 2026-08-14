'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, RefreshCw, Sparkles, FlaskConical, MapPin, Tag, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRotatorPreview } from '@/services/rotator/hooks';
import type { Cluster } from '@/lib/api/clusters';
import type { RotatorDeal, RotationConfig } from '@/services/rotator/types';
import { windowForInstant, DEFAULT_ROTATION_WINDOW_SECONDS, STRATEGY_LABELS } from '@/services/rotator/types';

interface RotationPreviewModalProps {
    open: boolean;
    cluster: Cluster | null;
    onWhy: (deal: { id: string; name: string; businessName: string; category: string; status: 'active' }) => void;
    onView?: (deal: RotatorDeal) => void;
    onClose: () => void;
    /** Seconds per rotation window. Defaults to the platform default (60s). */
    windowSeconds?: number;
    /** Live cluster config — used to reflect real slot count, strategy and weights. */
    config?: RotationConfig | null;
}

const FALLBACK_DEALS: RotatorDeal[] = [
    { id: 'ph-1', name: '20% Off Lunch Special', businessId: 'ph-b1', businessName: 'Restaurant A', categoryId: 'cat-food', category: 'Food & Drink', status: 'active', startDate: null, endDate: null },
    { id: 'ph-2', name: 'Buy 2 Get 1 Dine-In', businessId: 'ph-b2', businessName: 'Store B', categoryId: 'cat-food', category: 'Food & Drink', status: 'active', startDate: null, endDate: null },
    { id: 'ph-3', name: 'Free First Consultation', businessId: 'ph-b3', businessName: 'Business D', categoryId: 'cat-services', category: 'Services', status: 'active', startDate: null, endDate: null },
];

export default function RotationPreviewModal({ open, cluster, onWhy, onView, onClose, windowSeconds = DEFAULT_ROTATION_WINDOW_SECONDS, config }: RotationPreviewModalProps) {
    // Live ticking clock so the current window rolls over in real time.
    const [now, setNow] = useState(() => new Date());
    // Seed = which simulated arrangement we're showing. Auto-advances whenever
    // the live rotation window changes so the deals "rotate" like production.
    const [seed, setSeed] = useState(0);
    const [lastWindowIndex, setLastWindowIndex] = useState(-1);

    const liveWindow = windowForInstant(now, windowSeconds);
    const isCurrent = seed === 0;

    const { data: preview, isLoading } = useRotatorPreview(open ? cluster?.id : undefined, seed);

    // Only tick while open, and reset the simulation each time it opens.
    useEffect(() => {
        if (!open) return;
        setSeed(0);
        setNow(new Date());
        setLastWindowIndex(windowForInstant(new Date(), windowSeconds).index);
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, [open, windowSeconds]);

    // When the live window rolls over, advance the seed -> new arrangement.
    useEffect(() => {
        if (!open) return;
        if (liveWindow.index !== lastWindowIndex) {
            setLastWindowIndex(liveWindow.index);
            setSeed(s => s + 1);
        }
    }, [liveWindow.index, lastWindowIndex, open]);

    if (!open || !cluster) return null;

    const deals = preview?.deals?.map(d => d as RotatorDeal).slice(0, 6) ?? FALLBACK_DEALS.slice(0, 5);

    const nextPreview = () => setSeed(s => s + 1);

    const rotateIn = liveWindow.remainingSeconds;

    // Reflect the real cluster config in the copy where we can.
    const slotCount = config?.featuredSlots?.mode === 'manual'
        ? String(config.featuredSlots.count)
        : 'auto';
    const strategyText = config
        ? config.rotation.mode === 'manual'
            ? STRATEGY_LABELS[config.rotation.strategy] ?? 'manual'
            : 'balanced'
        : null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Phone-style header */}
                    <div className="bg-gradient-to-br from-primary to-primary-hover px-6 py-5 text-white shrink-0 rounded-t-3xl relative">
                        <button onClick={onClose} className="absolute top-4 right-4 size-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-white/15 rounded-full px-2.5 py-1 w-fit">
                            <FlaskConical size={11} /> Current window preview
                        </div>
                        <h3 className="font-display font-bold text-xl mt-3 flex items-center gap-2">
                            <MapPin size={16} /> {cluster.name}
                        </h3>
                        <p className="text-xs text-white/70 mt-0.5">Featured deals a customer sees when scanning this cluster right now.</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums">
                                <Timer size={11} />
                                Current window · {liveWindow.label}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums">
                                <RefreshCw size={10} className={rotateIn <= 10 ? 'animate-spin' : ''} />
                                {isCurrent ? `rotates in ${rotateIn}s` : `arrangement ${seed + 1}`}
                            </span>
                            {strategyText && (
                                <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1 text-[10px] font-bold">
                                    {slotCount} slots · {strategyText}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Deals */}
                    <div className="bg-gray-100 p-4 flex-1 min-h-0 overflow-y-auto rounded-b-3xl">
                        <div className="flex items-center justify-between px-0.5 mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Featured Deals</p>
                            {isLoading && <Loader2 size={12} className="animate-spin text-primary" />}
                        </div>

                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div
                                key={seed}
                                layout
                                className="space-y-3"
                            >
                                {deals.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-8 text-center text-xs font-bold text-text-secondary">
                                        No eligible deals to preview yet.
                                    </div>
                                ) : deals.map((d, i) => (
                                    <motion.div
                                        key={d.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -8 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center shrink-0 relative">
                                                <Tag size={18} />
                                                <span className="absolute -top-1 -right-1 size-4 rounded-full bg-primary text-white text-[8px] font-black flex items-center justify-center">
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-text-main truncate">{d.name}</p>
                                                    {d.isTrending && (
                                                        <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest">
                                                            <Sparkles size={8} /> Trending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-text-secondary mt-0.5">{d.businessName} · {d.category || 'Offer'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => onView?.(d)}
                                                className="h-8 rounded-lg bg-gray-50 hover:bg-primary/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                                            >
                                                View Deal
                                            </button>
                                            <button
                                                onClick={() => onWhy({ id: d.id, name: d.name, businessName: d.businessName, category: d.category || 'Offer', status: 'active' })}
                                                className="h-8 rounded-lg bg-gray-50 hover:bg-primary/5 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                                            >
                                                Why is this showing?
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        <div className="rounded-2xl border border-dashed border-gray-300 p-3 text-center text-[10px] font-medium text-text-secondary bg-white/60 mt-3">
                            This is the live arrangement for window {liveWindow.label} — anyone scanning the cluster now sees the same {slotCount} featured deals{strategyText ? `, ordered by ${strategyText} strategy` : ''}. Deals re-arrange automatically when the window ends ({rotateIn}s).
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white flex items-center gap-2 shrink-0 border-t border-gray-100">
                        <button
                            onClick={nextPreview}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={13} /> {isCurrent ? 'Preview Next Window' : 'Next Window'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
