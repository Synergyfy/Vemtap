'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gift, 
    ArrowLeft, 
    Star, 
    Clock, 
    Tag,
    Loader2,
    ChevronRight,
    X,
    Sparkles,
    ShoppingBag,
    Search,
    LayoutGrid,
    List,
    Plus
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useAddToCart } from '@/services/catalogue-cart/hooks';
import { useCartMergeOnLogin } from '@/hooks/useCartMergeOnLogin';
import { 
    useCatalogueOffersPublic, 
    CatalogueOffer, 
    useCreateCatalogueOrder 
} from '@/services/catalogue/hooks';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PremiumBottomNav } from '@/components/visitor/PremiumBottomNav';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { api } from '@/lib/api';
import { User } from '@/store/useAuthStore';

export default function OffersPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    const guestCart = useGuestCartStore();
    const addToCartMutation = useAddToCart();
    useCartMergeOnLogin(branchId);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<CatalogueOffer | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [pendingOffer, setPendingOffer] = useState<{offer: CatalogueOffer, qty: number} | null>(null);
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
    const [qty, setQty] = useState(1);

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
            if (selectedOffer) setSelectedOffer(null);
        } catch {
            toast.error('Failed to add to cart');
        } finally {
            setIsAddingToCart(null);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: offersResponse, isLoading } = useCatalogueOffersPublic(branchId || '', {
        search: debouncedSearch
    });
    const offers = offersResponse?.data || [];

    const createOrderMutation = useCreateCatalogueOrder();

    const handleClaim = async (offer: CatalogueOffer, qty: number) => {
        const executeClaim = async (currentUser: User) => {
            setIsSubmitting(true);
            try {
                await createOrderMutation.mutateAsync({
                    branchId: branchId!,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [{ offerId: offer.id, quantity: qty }]
                });
                toast.success('Offer claimed successfully!', { icon: '🎁' });
                setSelectedOffer(null);
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to claim offer');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setPendingOffer({ offer, qty });
            setShowAuthForm(true);
        } else {
            executeClaim(user as User);
        }
    };

    const onAuthComplete = async (data: StepFormData) => {
        setIsSubmitting(true);
        try {
            const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ' ';
            
            await api.post(`/visitors/signup`, { firstName, lastName, email: data.email, phone: data.phone });
            const authResponse = await api.post('/auth/login', { identifier: data.email, password: '123456' });

            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                setUserData(data);
                setShowAuthForm(false);
                if (pendingOffer) {
                    await handleClaim(pendingOffer.offer, pendingOffer.qty);
                    setPendingOffer(null);
                }
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
            <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-surface/70 backdrop-blur-xl z-50">
                <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => router.push(`/${params.slug}/${params.code}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={20} className="md:size-6" />
                    </button>
                    <span className="text-lg md:text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline tracking-tight">
                        {storeName}
                    </span>
                </div>
            </header>

            <main className="pt-20 md:pt-24 px-4 md:px-6 max-w-4xl mx-auto space-y-8 md:space-y-12">
                <section className="space-y-4 md:space-y-6">
                    <h1 className="text-2xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight text-center">
                        Exclusive <span className="bg-gradient-to-r from-primary to-secondary-container bg-clip-text text-transparent">Hot Deals</span>
                    </h1>
                    
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search offers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                        />
                    </div>

                    <div className="flex bg-white p-1 rounded-2xl shadow-sm w-full max-w-[200px] mx-auto">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex-1 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2",
                                viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-outline hover:bg-slate-50"
                            )}
                        >
                            <LayoutGrid size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">Grid</span>
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex-1 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2",
                                viewMode === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-outline hover:bg-slate-50"
                            )}
                        >
                            <List size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">List</span>
                        </button>
                    </div>
                </section>

                <section className={cn(
                    "grid gap-6 sm:gap-8",
                    viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
                )}>
                    {offers.map((offer) => {
                        const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
                        const savings = originalPrice - offer.calculatedPrice;
                        const percent = Math.round((savings / originalPrice) * 100);

                        return (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => router.push(`/${params.slug}/${params.code}/offers/${offer.id}`)}
                                className={cn(
                                    "relative w-full bg-primary-container rounded-lg asymmetric-leaf overflow-hidden group shadow-2xl shadow-primary/10 cursor-pointer",
                                    viewMode === 'grid' ? "aspect-square sm:aspect-[4/5]" : "aspect-[16/9]"
                                )}
                            >
                                <img 
                                    src={offer.mainImage || '/placeholder.png'} 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105"
                                    alt={offer.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 md:p-8">
                                    <div className={cn(
                                        "flex justify-between items-end",
                                        viewMode === 'grid' ? "flex-col items-start gap-4" : ""
                                    )}>
                                        <div className="space-y-1 sm:space-y-2">
                                            {savings > 0 && (
                                                <span className="bg-secondary-container text-on-secondary-container px-3 py-0.5 sm:px-4 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-4 w-fit inline-block">
                                                    SAVE {formatPrice(savings)}
                                                </span>
                                            )}
                                            <h2 className={cn(
                                                "font-headline font-bold text-white leading-tight",
                                                viewMode === 'grid' ? "text-xl sm:text-2xl" : "text-3xl"
                                            )}>{offer.name}</h2>
                                            {viewMode === 'list' && (
                                                <p className="text-white/80 text-sm max-w-xs line-clamp-1">{offer.description}</p>
                                            )}
                                        </div>
                                        <div className={cn(
                                            "text-right",
                                            viewMode === 'grid' ? "text-left w-full flex items-baseline gap-2" : ""
                                        )}>
                                            {savings > 0 && (
                                                <p className="text-white/50 text-xs sm:text-sm line-through font-bold">{formatPrice(originalPrice)}</p>
                                            )}
                                            <p className={cn(
                                                "font-black text-white font-display tracking-tight",
                                                viewMode === 'grid' ? "text-2xl sm:text-3xl" : "text-4xl"
                                            )}>{formatPrice(offer.calculatedPrice)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center sm:hidden">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOffer(offer);
                                            }}
                                            className="px-4 py-2 bg-white text-primary text-[10px] font-black uppercase tracking-widest rounded-xl"
                                        >
                                            Claim Offer
                                        </button>
                                    </div>
                                    {viewMode === 'list' && (
                                        <div className="hidden sm:block">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(offer, 1);
                                                }}
                                                disabled={isAddingToCart === offer.id}
                                                className="px-4 py-2 bg-slate-100 text-slate-800 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors mr-2"
                                            >
                                                Add to Cart
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOffer(offer);
                                                }}
                                                className="px-8 py-3 bg-white text-primary text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-opacity-90 transition-all"
                                            >
                                                Claim Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {viewMode === 'grid' && (
                                    <div className="absolute bottom-4 right-4 hidden sm:block">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOffer(offer);
                                            }}
                                            className="size-12 bg-white text-primary flex items-center justify-center rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <Plus size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                )}
                                {percent > 0 && (
                                    <div className={cn(
                                        "absolute bg-white text-primary rounded-full flex flex-col items-center justify-center shadow-xl transform group-hover:rotate-12 transition-transform",
                                        viewMode === 'grid' ? "top-3 right-3 size-12" : "top-6 right-6 size-16"
                                    )}>
                                        <span className={cn("font-black leading-none", viewMode === 'grid' ? "text-base" : "text-lg")}>{percent}%</span>
                                        <span className="text-[8px] font-black uppercase">OFF</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}

                    {offers.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <Gift size={48} className="mx-auto text-slate-200" />
                            <p className="text-outline font-bold">No active offers at the moment.</p>
                        </div>
                    )}
                </section>
            </main>

            <PremiumBottomNav />

            {/* Offer Detail Modal */}
            <AnimatePresence>
                {selectedOffer && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOffer(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <button 
                                onClick={() => setSelectedOffer(null)}
                                className="absolute top-6 right-6 z-10 size-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="overflow-y-auto no-scrollbar">
                                <div className="relative aspect-[16/9] w-full bg-primary">
                                    <img 
                                        src={selectedOffer.mainImage || '/placeholder.png'} 
                                        alt={selectedOffer.name}
                                        className="w-full h-full object-cover mix-blend-overlay opacity-60"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-5 md:p-8 space-y-4">
                                        <Gift className="size-8 md:size-12" />
                                        <h2 className="text-2xl md:text-4xl font-headline font-black tracking-tight">{selectedOffer.name}</h2>
                                    </div>
                                </div>

                                <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                                    <div className="flex items-center justify-between bg-emerald-50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-emerald-100">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <Tag size={20} className="md:size-6" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-widest">Limited Deal</p>
                                                <p className="text-xs md:text-sm font-bold text-emerald-500">Includes {selectedOffer.items.length} items</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 text-[8px] md:text-xs font-black uppercase">Final Price</p>
                                            <p className="text-xl md:text-3xl font-black text-emerald-600">{formatPrice(selectedOffer.calculatedPrice)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 md:space-y-6">
                                        <h4 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-outline">What's in the bundle</h4>
                                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                                            {selectedOffer.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 md:gap-5 p-3 md:p-5 bg-white border border-slate-100 rounded-2xl md:rounded-3xl shadow-sm">
                                                    <div className="size-12 md:size-16 rounded-xl md:rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                                                        <img src={item.mainImage || '/placeholder.png'} className="size-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-base md:text-lg font-black text-slate-900 truncate">{item.name}</p>
                                                        <p className="text-[10px] md:text-xs font-bold text-primary uppercase">{item.category?.name || 'General'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleClaim(selectedOffer, 1)}
                                        disabled={isSubmitting}
                                        className="w-full h-16 md:h-20 bg-slate-900 text-white text-lg md:text-xl font-black rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <ShoppingBag size={24} />
                                                Claim Offer Now
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Auth Form Modal */}
            <AnimatePresence>
                {showAuthForm && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <div className="relative w-full max-w-lg">
                            <StepForm 
                                storeName={storeName}
                                logoUrl={logoUrl}
                                customWelcomeTitle="Claim Offer"
                                customWelcomeMessage="Share your info to unlock this exclusive deal."
                                isSubmitting={isSubmitting}
                                onBack={() => setShowAuthForm(false)}
                                onSubmit={onAuthComplete}
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
