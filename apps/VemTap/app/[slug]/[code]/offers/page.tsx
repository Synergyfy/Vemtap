'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Loader2,
    Search,
    SlidersHorizontal,
    X,
    LayoutGrid,
    List,
    Plus,
    Check,
    Clock,
    Gift,
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useAddToCart } from '@/services/catalogue-cart/hooks';
import { useCartMergeOnLogin } from '@/hooks/useCartMergeOnLogin';
import { useCatalogueOffersPublic, CatalogueOffer } from '@/services/catalogue/hooks';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PremiumBottomNav } from '@/components/visitor/PremiumBottomNav';
import DealEngagementBar from '@/components/deals/DealEngagementBar';

export default function OffersPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName } = useCustomerFlowStore();
    const { isAuthenticated } = useAuthStore();
    const guestCart = useGuestCartStore();
    const addToCartMutation = useAddToCart();
    useCartMergeOnLogin(branchId);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState('newest');
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: offersResponse, isLoading } = useCatalogueOffersPublic(branchId || '', {
        search: debouncedSearch,
        sortBy,
    });
    const offers = offersResponse?.data || [];

    const handleAddToCart = async (offer: CatalogueOffer, quantity: number = 1) => {
        if (!branchId) return;
        setIsAddingToCart(offer.id);
        try {
            if (isAuthenticated) {
                await addToCartMutation.mutateAsync({ branchId, offerId: offer.id, quantity });
            } else {
                guestCart.addItem({
                    branchId,
                    offerId: offer.id,
                    quantity,
                    name: offer.name,
                    price: Number(offer.calculatedPrice),
                    image: offer.mainImage ?? undefined,
                    itemType: 'offer',
                });
            }
            toast.success('Added to cart!', { icon: '🛒' });
        } catch {
            toast.error('Failed to add to cart');
        } finally {
            setIsAddingToCart(null);
        }
    };

    const detailHref = (offerId: string) => `/${params.slug}/${params.code}/offers/${offerId}`;

    const offerMeta = (offer: CatalogueOffer) => {
        const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
        const savings = originalPrice - offer.calculatedPrice;
        const percent = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
        return { originalPrice, savings, percent };
    };

    return (
        <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-body pb-32">
            {/* ─── Header ─── */}
            <header className="sticky top-0 z-50 bg-[#f7f9fb]/90 backdrop-blur-md border-b border-[#c2c6d7]/30 flex justify-center">
                <div className="w-full max-w-[1400px] flex items-center justify-between px-4 md:px-6 h-14">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push(`/${params.slug}/${params.code}`)}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[#191c1e] hover:bg-[#f2f4f6] transition-colors active:scale-95"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-[16px] font-semibold text-[#191c1e] truncate">{storeName} — Offers</h1>
                    </div>
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="h-9 px-3 flex items-center gap-2 rounded-xl border border-[#c2c6d7]/40 bg-white text-[#0055c4] hover:bg-[#0055c4]/5 transition-colors"
                    >
                        <SlidersHorizontal size={16} />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Filter</span>
                        {(searchQuery || sortBy !== 'newest') && (
                            <span className="size-1.5 bg-[#0055c4] rounded-full animate-pulse" />
                        )}
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto px-4 md:px-6 pt-4 space-y-4">
                {/* ─── Search Bar ─── */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727786]" size={18} />
                    <input
                        type="text"
                        placeholder="Search offers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-white rounded-xl border border-[#c2c6d7]/40 outline-none text-[14px] placeholder:text-[#727786]/70 focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4]/30 transition-all"
                    />
                </div>

                {/* ─── Result Meta ─── */}
                <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-[#727786]">
                        {offers.length} {offers.length === 1 ? 'offer' : 'offers'} available
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                viewMode === 'grid' ? 'bg-[#0055c4] text-white' : 'bg-white text-[#727786] border border-[#c2c6d7]/40'
                            )}
                        >
                            <LayoutGrid size={15} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                viewMode === 'list' ? 'bg-[#0055c4] text-white' : 'bg-white text-[#727786] border border-[#c2c6d7]/40'
                            )}
                        >
                            <List size={15} />
                        </button>
                    </div>
                </div>

                {/* ─── Deals Grid ─── */}
                {isLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-xl bg-white border border-[#c2c6d7]/30 overflow-hidden animate-pulse">
                                <div className="h-36 lg:h-40 w-full bg-[#eef2f7]" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-[#eef2f7] rounded w-3/4" />
                                    <div className="h-3 bg-[#eef2f7] rounded w-1/2" />
                                    <div className="h-5 bg-[#eef2f7] rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : offers.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {offers.map((offer) => {
                                const { originalPrice, savings, percent } = offerMeta(offer);
                                const href = detailHref(offer.id);
                                return (
                                    <div
                                        key={offer.id}
                                        className="bg-white rounded-xl border border-[#c2c6d7]/40 overflow-hidden shadow-sm group transition-all hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                        <Link href={href} className="block">
                                            <div className="relative h-36 lg:h-40 w-full overflow-hidden" style={{ background: '#eef2f7' }}>
                                                <img
                                                    src={offer.mainImage || '/placeholder.png'}
                                                    alt={offer.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                                                {percent > 0 && (
                                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold text-white" style={{ background: '#ba1a1a', fontSize: 10, lineHeight: '14px' }}>
                                                        {percent}% OFF
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(offer, 1); }}
                                                    disabled={isAddingToCart === offer.id}
                                                    title="Add to cart"
                                                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-[#0055c4] shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-70"
                                                >
                                                    {isAddingToCart === offer.id
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <Plus size={18} strokeWidth={2.5} />}
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="text-[13px] lg:text-[14px] font-semibold leading-[18px] line-clamp-1 text-[#191c1e]">{offer.name}</h3>
                                                <p className="text-[11px] leading-[14px] line-clamp-1 mt-0.5 text-[#727786]">{offer.description || storeName}</p>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <span className="text-[15px] lg:text-[16px] font-bold text-[#0055c4]">
                                                        {Number(offer.calculatedPrice) === 0 ? 'FREE' : formatPrice(offer.calculatedPrice)}
                                                    </span>
                                                    {savings > 0 && (
                                                        <span className="text-[11px] line-through text-[#727786]">{formatPrice(originalPrice)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="px-3 pb-3">
                                            <DealEngagementBar
                                                offerId={offer.id}
                                                offerTitle={offer.name}
                                                offerDescription={offer.description || ''}
                                                dealUrl={href}
                                                businessName={storeName}
                                                compact
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {offers.map((offer) => {
                                const { originalPrice, savings, percent } = offerMeta(offer);
                                const href = detailHref(offer.id);
                                return (
                                    <div key={offer.id} className="bg-white rounded-xl border border-[#c2c6d7]/40 overflow-hidden shadow-sm group transition-all hover:shadow-md">
                                        <Link href={href} className="block">
                                            <div className="flex">
                                                <div className="relative w-28 sm:w-40 shrink-0 aspect-[4/3]" style={{ background: '#eef2f7' }}>
                                                    <img src={offer.mainImage || '/placeholder.png'} alt={offer.name} className="w-full h-full object-cover" />
                                                    {percent > 0 && (
                                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold text-white" style={{ background: '#ba1a1a', fontSize: 10, lineHeight: '14px' }}>
                                                            {percent}% OFF
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 flex-1 min-w-0">
                                                    <h3 className="text-[14px] font-semibold text-[#191c1e] line-clamp-1">{offer.name}</h3>
                                                    <p className="text-[12px] text-[#727786] line-clamp-1 mt-0.5">{offer.description || storeName}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[16px] font-bold text-[#0055c4]">
                                                            {Number(offer.calculatedPrice) === 0 ? 'FREE' : formatPrice(offer.calculatedPrice)}
                                                        </span>
                                                        {savings > 0 && (
                                                            <span className="text-[12px] line-through text-[#727786]">{formatPrice(originalPrice)}</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(offer, 1); }}
                                                        disabled={isAddingToCart === offer.id}
                                                        className="mt-2 h-8 px-3 rounded-lg bg-[#0055c4] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-[#0055c4]/90 transition-colors disabled:opacity-70"
                                                    >
                                                        {isAddingToCart === offer.id
                                                            ? <Loader2 size={14} className="animate-spin" />
                                                            : <><Check size={13} /> Add to Cart</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="py-16 text-center">
                        <div className="relative mx-auto size-16 mb-4">
                            <div className="absolute inset-0 rounded-2xl -rotate-6 bg-[#0055c4]/10" />
                            <div className="relative size-16 rounded-2xl flex items-center justify-center bg-white border border-[#c2c6d7]/40">
                                <Gift size={28} className="text-[#0055c4]" />
                            </div>
                        </div>
                        <p className="font-bold text-sm text-[#191c1e]">No active offers at the moment</p>
                        <p className="text-xs mt-1 text-[#727786]">Check back soon — new deals are on the way.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSortBy('newest'); }}
                            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white bg-[#0055c4] active:scale-95 transition-all"
                        >
                            View all offers
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1.5 pt-1 text-[#727786]">
                    <Clock size={13} />
                    <span className="text-[11px] font-medium">Times shown are for available offers.</span>
                </div>
            </main>

            <PremiumBottomNav />

            {/* ─── Filter Modal ─── */}
            <AnimatePresence>
                {isFilterOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-lg bg-[#f7f9fb] rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 space-y-7 max-h-[85vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[18px] font-semibold text-[#191c1e]">Filters &amp; Sort</h2>
                                    <button onClick={() => setIsFilterOpen(false)} className="size-9 bg-white rounded-full flex items-center justify-center hover:bg-[#f2f4f6] border border-[#c2c6d7]/40 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#727786]">Search Keyword</h4>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727786]" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Find the perfect deal..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-[#c2c6d7]/40 outline-none text-[14px] focus:border-[#0055c4] focus:ring-1 focus:ring-[#0055c4]/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#727786]">Order By</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'newest', name: 'Latest Arrivals' },
                                            { id: 'price_asc', name: 'Lowest Price' },
                                            { id: 'price_desc', name: 'Highest Price' },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id)}
                                                className={cn(
                                                    'px-4 py-2 rounded-xl text-[12px] font-semibold transition-all border',
                                                    sortBy === opt.id
                                                        ? 'bg-[#0055c4] text-white border-[#0055c4]'
                                                        : 'bg-white text-[#727786] border-[#c2c6d7]/40'
                                                )}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#727786]">Display View</h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                'flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 border',
                                                viewMode === 'grid' ? 'bg-[#0055c4] text-white border-[#0055c4]' : 'bg-white text-[#727786] border-[#c2c6d7]/40'
                                            )}
                                        >
                                            <LayoutGrid size={16} />
                                            <span className="text-[12px] font-bold uppercase tracking-wider">Grid</span>
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                'flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 border',
                                                viewMode === 'list' ? 'bg-[#0055c4] text-white border-[#0055c4]' : 'bg-white text-[#727786] border-[#c2c6d7]/40'
                                            )}
                                        >
                                            <List size={16} />
                                            <span className="text-[12px] font-bold uppercase tracking-wider">List</span>
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full py-3.5 bg-[#0055c4] text-white font-semibold rounded-xl shadow-lg hover:bg-[#0055c4]/90 transition-all uppercase tracking-widest text-[12px]"
                                >
                                    Apply filters
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}