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
    Search
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueOffersPublic, 
    CatalogueOffer, 
    useCreateCatalogueOrder 
} from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
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
    
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedOffer, setSelectedOffer] = useState<CatalogueOffer | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [pendingOffer, setPendingOffer] = useState<{offer: CatalogueOffer, qty: number} | null>(null);

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
            <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-surface/70 backdrop-blur-xl z-50">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/${params.slug}/${params.code}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <span className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline tracking-tight">
                        {storeName}
                    </span>
                </div>
            </header>

            <main className="pt-24 px-6 max-w-4xl mx-auto space-y-12">
                <section className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight text-center">
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
                </section>

                <section className="space-y-8">
                    {offers.map((offer) => {
                        const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
                        const savings = originalPrice - offer.calculatedPrice;
                        const percent = Math.round((savings / originalPrice) * 100);

                        return (
                            <motion.div
                                key={offer.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedOffer(offer)}
                                className="relative w-full aspect-[16/9] bg-primary-container rounded-lg asymmetric-leaf overflow-hidden group shadow-2xl shadow-primary/10 cursor-pointer"
                            >
                                <img 
                                    src={offer.mainImage || '/placeholder.png'} 
                                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-700 group-hover:scale-105"
                                    alt={offer.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 w-fit inline-block">
                                                SAVE ₦{savings.toLocaleString()}
                                            </span>
                                            <h2 className="text-3xl font-headline font-bold text-white leading-tight">{offer.name}</h2>
                                            <p className="text-white/80 text-sm max-w-xs line-clamp-1">{offer.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/50 text-sm line-through font-bold">₦{originalPrice.toLocaleString()}</p>
                                            <p className="text-4xl font-black text-white font-display tracking-tight">₦{offer.calculatedPrice.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-6 right-6 bg-white text-primary size-16 rounded-full flex flex-col items-center justify-center shadow-xl transform group-hover:rotate-12 transition-transform">
                                    <span className="text-lg font-black leading-none">{percent}%</span>
                                    <span className="text-[8px] font-black uppercase">OFF</span>
                                </div>
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
                            className="relative w-full max-w-2xl bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
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
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8 space-y-4">
                                        <Gift size={48} />
                                        <h2 className="text-4xl font-headline font-black tracking-tight">{selectedOffer.name}</h2>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="flex items-center justify-between bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <Tag size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Limited Deal</p>
                                                <p className="text-sm font-bold text-emerald-500">Includes {selectedOffer.items.length} premium items</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 text-xs font-black uppercase">Final Price</p>
                                            <p className="text-3xl font-black text-emerald-600">₦{selectedOffer.calculatedPrice.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-xs font-black uppercase tracking-[0.4em] text-outline">What's in the bundle</h4>
                                        <div className="grid grid-cols-1 gap-4">
                                            {selectedOffer.items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
                                                    <div className="size-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0">
                                                        <img src={item.mainImage || '/placeholder.png'} className="size-full object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-lg font-black text-slate-900 truncate">{item.name}</p>
                                                        <p className="text-xs font-bold text-primary uppercase">{item.category?.name || 'General'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleClaim(selectedOffer, 1)}
                                        disabled={isSubmitting}
                                        className="w-full h-20 bg-slate-900 text-white text-xl font-black rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
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
