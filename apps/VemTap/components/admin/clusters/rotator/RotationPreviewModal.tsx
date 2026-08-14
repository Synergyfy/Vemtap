'use client';

import React, { useState } from 'react';
import { X, Loader2, RefreshCw, Sparkles, FlaskConical, MapPin, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRotatorPreview } from '@/services/rotator/hooks';
import type { Cluster } from '@/lib/api/clusters';
import type { RotatorDeal } from '@/services/rotator/types';

interface RotationPreviewModalProps {
    open: boolean;
    cluster: Cluster | null;
    onWhy: (deal: { id: string; name: string; businessName: string; category: string; status: 'active' }) => void;
    onView?: (deal: RotatorDeal) => void;
    onClose: () => void;
}

const FALLBACK_DEALS: RotatorDeal[] = [
    { id: 'ph-1', name: '20% Off Lunch Special', businessId: 'ph-b1', businessName: 'Restaurant A', categoryId: 'cat-food', category: 'Food & Drink', status: 'active', startDate: null, endDate: null },
    { id: 'ph-2', name: 'Buy 2 Get 1 Dine-In', businessId: 'ph-b2', businessName: 'Store B', categoryId: 'cat-food', category: 'Food & Drink', status: 'active', startDate: null, endDate: null },
    { id: 'ph-3', name: 'Free First Consultation', businessId: 'ph-b3', businessName: 'Business D', categoryId: 'cat-services', category: 'Services', status: 'active', startDate: null, endDate: null },
];

export default function RotationPreviewModal({ open, cluster, onWhy, onView, onClose }: RotationPreviewModalProps) {
    const [seed, setSeed] = useState(0);
    const { data: preview, isLoading } = useRotatorPreview(open ? cluster?.id : undefined, seed);

    if (!open || !cluster) return null;

    const deals = preview?.deals?.map(d => d as RotatorDeal).slice(0, 6) ?? FALLBACK_DEALS.slice(0, 5);

    const nextPreview = () => setSeed(s => s + 1);

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
                            <FlaskConical size={11} /> Simulated preview
                        </div>
                        <h3 className="font-display font-bold text-xl mt-3 flex items-center gap-2">
                            <MapPin size={16} /> {cluster.name}
                        </h3>
                        <p className="text-xs text-white/70 mt-0.5">Featured deals a customer may see when scanning this cluster.</p>
                    </div>

                    {/* Deals */}
                    <div className="bg-gray-100 p-4 flex-1 min-h-0 overflow-y-auto space-y-3 rounded-b-3xl">
                        <div className="flex items-center justify-between px-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Featured Deals</p>
                            {isLoading && <Loader2 size={12} className="animate-spin text-primary" />}
                        </div>
                        {deals.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center text-xs font-bold text-text-secondary">
                                No eligible deals to preview yet.
                            </div>
                        ) : deals.map((d, i) => (
                            <div key={`${d.id}-${seed}-${i}`} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-start gap-3">
                                    <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary flex items-center justify-center shrink-0">
                                        <Tag size={18} />
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
                            </div>
                        ))}

                        <div className="rounded-2xl border border-dashed border-gray-300 p-3 text-center text-[10px] font-medium text-text-secondary bg-white/60">
                            Outcome {seed + 1} — rotation logic will replace this simulation when the backend ships.
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white flex items-center gap-2 shrink-0 border-t border-gray-100">
                        <button
                            onClick={nextPreview}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={13} /> Next Preview
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}