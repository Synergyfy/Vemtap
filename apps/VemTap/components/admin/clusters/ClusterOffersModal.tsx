'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Loader2, Search, Pin, PinOff, MapPin, Tag, Sparkles, Hand, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { adminClustersApi } from '@/lib/api/clusters';
import type { Cluster, ClusterOfferRow } from '@/lib/api/clusters';
import { getPublicOffers } from '@/services/deals/hooks';
import type { DealOffer } from '@/services/deals/types';

interface ClusterOffersModalProps {
    open: boolean;
    cluster: Cluster | null;
    onClose: () => void;
    onChanged: () => void;
}

interface OfferRow {
    id: string;
    name: string;
    description?: string;
    businessName?: string;
    mainImage?: string | null;
    isTrending?: boolean;
    reason?: string;
}

export default function ClusterOffersModal({ open, cluster, onClose, onChanged }: ClusterOffersModalProps) {
    const [pinned, setPinned] = useState<OfferRow[]>([]);
    const [autoMatched, setAutoMatched] = useState<OfferRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [dealSearch, setDealSearch] = useState('');
    const [dealResults, setDealResults] = useState<DealOffer[]>([]);
    const [dealSearching, setDealSearching] = useState(false);
    const [dealSearchOpen, setDealSearchOpen] = useState(false);
    const dealSearchRef = React.useRef<HTMLDivElement>(null);

    const fetchOffers = useCallback(async () => {
        if (!cluster) return;
        try {
            const data = await adminClustersApi.listOffers(cluster.id);
            const toRow = (o: ClusterOfferRow): OfferRow => ({
                id: o.id,
                name: o.name,
                description: o.description,
                businessName: o.businessName,
                mainImage: o.mainImage,
                isTrending: o.isTrending,
                reason: o.matchReason,
            });
            setPinned((data.pinned || []).map(toRow));
            setAutoMatched((data.autoMatched || []).map(toRow));
        } catch {
            setPinned([]);
            setAutoMatched([]);
        } finally {
            setLoading(false);
        }
    }, [cluster]);

    useEffect(() => {
        if (!open || !cluster) return;
        adminClustersApi.listOffers(cluster.id)
            .then(data => {
                const toRow = (o: ClusterOfferRow): OfferRow => ({
                    id: o.id,
                    name: o.name,
                    description: o.description,
                    businessName: o.businessName,
                    mainImage: o.mainImage,
                    isTrending: o.isTrending,
                    reason: o.matchReason,
                });
                setPinned((data.pinned || []).map(toRow));
                setAutoMatched((data.autoMatched || []).map(toRow));
            })
            .catch(() => {
                setPinned([]);
                setAutoMatched([]);
            })
            .finally(() => setLoading(false));
    }, [open, cluster]);

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dealSearchRef.current && !dealSearchRef.current.contains(e.target as Node)) {
                setDealSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (!open || !cluster) return null;

    const searchDeals = async (query: string) => {
        if (!query.trim()) {
            setDealResults([]);
            return;
        }
        setDealSearching(true);
        try {
            const res = await getPublicOffers({ search: query.trim(), limit: 8 });
            const results = Array.isArray(res) ? res : res?.data || [];
            setDealResults(results);
        } catch {
            setDealResults([]);
        } finally {
            setDealSearching(false);
        }
    };

    const pinOffer = async (offerId: string, pinnedNow: boolean) => {
        setBusyId(offerId);
        try {
            await adminClustersApi.setOfferPinned(cluster.id, offerId, pinnedNow);
            await fetchOffers();
            onChanged();
            toast.success(pinnedNow ? 'Deal pinned to cluster' : 'Deal unpinned');
        } catch {
            toast.error('Failed to update pin');
        } finally {
            setBusyId(null);
        }
    };

    const pinFromSearch = async (offer: DealOffer) => {
        await pinOffer(offer.id, true);
        setDealSearch('');
        setDealResults([]);
        setDealSearchOpen(false);
    };

    const renderRow = (row: OfferRow, isPinned: boolean) => (
        <div key={row.id} className="px-4 py-3 flex items-center gap-3">
            {row.mainImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.mainImage} alt="" className="size-9 rounded-lg object-cover shrink-0" />
            ) : (
                <div className="size-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                    <Tag size={14} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-text-main truncate">{row.name}</p>
                <p className="text-[11px] text-text-secondary truncate">
                    {row.businessName || 'Business'}
                    {row.isTrending ? ' • 🔥 Trending' : ''}
                    {row.reason ? ` • ${row.reason}` : ''}
                </p>
            </div>
            <button
                onClick={() => pinOffer(row.id, !isPinned)}
                disabled={busyId === row.id}
                className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50",
                    isPinned
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-gray-50 text-text-secondary hover:bg-primary/5 hover:text-primary"
                )}
                title={isPinned ? 'Unpin from cluster' : 'Pin to cluster'}
            >
                {busyId === row.id ? <Loader2 size={12} className="animate-spin" /> : isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                {isPinned ? 'Pinned' : 'Pin'}
            </button>
        </div>
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
                        <div>
                            <h3 className="font-display font-bold text-lg text-text-main">Cluster Deals</h3>
                            <p className="text-xs text-text-secondary font-medium flex items-center gap-1">
                                <MapPin size={11} />
                                {cluster.name}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto space-y-5">
                        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="size-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                                    <Sparkles size={16} />
                                </div>
                                <div className="text-xs text-text-secondary leading-snug">
                                    <p className="text-sm font-black text-text-main">Automatic location matching</p>
                                    Active offers from businesses with branches in{" "}
                                    <span className="font-bold text-primary">
                                        {[cluster.city, cluster.state, cluster.country].filter(Boolean).join(', ') || 'this cluster'}
                                    </span>
                                    {cluster.latitude != null && cluster.longitude != null && (
                                        <> — plus any within {cluster.radiusM || 2000}m of its GPS point.</>
                                    )}{' '}
                                    Pin offers manually below to force-include or override the auto-matched list.
                                </div>
                            </div>
                        </div>

                        <div className="relative" ref={dealSearchRef}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-1 flex items-center gap-1">
                                <Hand size={11} />
                                Pin a deal manually
                            </label>
                            <div className="relative mt-1.5">
                                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={dealSearch}
                                    onChange={(e) => {
                                        setDealSearch(e.target.value);
                                        setDealSearchOpen(true);
                                        searchDeals(e.target.value);
                                    }}
                                    onFocus={() => setDealSearchOpen(true)}
                                    placeholder="Search active deals by name or business…"
                                    className="w-full h-11 bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                />
                            </div>
                            {dealSearchOpen && (dealSearch.trim() || dealSearching) && (
                                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {dealSearching ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                            <Loader2 size={14} className="animate-spin" />
                                            Searching…
                                        </div>
                                    ) : dealResults.length > 0 ? (
                                        dealResults.map((offer) => (
                                            <button
                                                key={offer.id}
                                                onClick={() => pinFromSearch(offer)}
                                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                            >
                                                {offer.mainImage ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={offer.mainImage} alt="" className="size-9 rounded-lg object-cover shrink-0" />
                                                ) : (
                                                    <div className="size-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0">
                                                        <Tag size={14} />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[13px] font-bold text-text-main truncate">{offer.name}</p>
                                                    <p className="text-[11px] text-text-secondary truncate">
                                                        {offer.business?.name || 'Business'}
                                                    </p>
                                                </div>
                                                <Link2 size={14} className="text-gray-300 shrink-0" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs font-bold text-text-secondary">No deals found.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="p-8 flex items-center justify-center gap-2 text-text-secondary text-xs font-bold">
                                <Loader2 size={14} className="animate-spin" />
                                Loading deals…
                            </div>
                        ) : (
                            <>
                                <div className="rounded-2xl border border-orange-100 overflow-hidden">
                                    <div className="px-4 py-3 bg-orange-50/60 border-b border-orange-100 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1">
                                            <Pin size={11} />
                                            Pinned Manually ({pinned.length})
                                        </p>
                                    </div>
                                    {pinned.length === 0 ? (
                                        <div className="p-6 text-center text-xs font-bold text-text-secondary">
                                            Nothing pinned yet — search above to pin a deal.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                                            {pinned.map(row => renderRow(row, true))}
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center gap-1">
                                            <Sparkles size={11} />
                                            Auto-Matched by Location ({autoMatched.length})
                                        </p>
                                    </div>
                                    {autoMatched.length === 0 ? (
                                        <div className="p-6 text-center text-xs font-bold text-text-secondary">
                                            No matching offers found for this location yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                                            {autoMatched.map(row => renderRow(row, false))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
