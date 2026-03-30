'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Star, 
    Gift, 
    Tag, 
    TagIcon,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    Sparkles,
    Flame,
    ShieldCheck,
    X
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueOfferDetails, 
    useCreateCatalogueOrder 
} from '@/services/catalogue/hooks';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { api } from '@/lib/api';
import { User } from '@/store/useAuthStore';

export default function OfferDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const { data: offer, isLoading } = useCatalogueOfferDetails(params.id as string);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [previewItem, setPreviewItem] = useState<any>(null);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleClaim = async () => {
        if (!offer) return;

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
                    items: [{ offerId: offer.id, quantity: 1 }]
                });
                toast.success('Offer claimed successfully!', { icon: '🎁' });
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to claim offer');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
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
                
                const currentUser = authResponse.user as User;
                await createOrderMutation.mutateAsync({
                    branchId: branchId!,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [{ offerId: offer!.id, quantity: 1 }]
                });
                toast.success('Offer claimed successfully!', { icon: '🎁' });
                router.push(`/${params.slug}/${params.code}/success`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !offer) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    const originalPrice = offer.items.reduce((sum, i) => sum + Number(i.price), 0);
    const savings = originalPrice - offer.calculatedPrice;
    const percent = Math.round((savings / originalPrice) * 100);

    return (
        <div className="min-h-screen bg-slate-900 font-body text-white pb-32">
            <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-slate-900/70 backdrop-blur-xl z-50 border-b border-white/10">
                <button onClick={() => router.back()} className="p-2 md:p-3 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl hover:bg-white/20 transition-all border border-white/10">
                    <ArrowLeft size={20} className="md:size-6" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] md:text-xs font-black tracking-[0.3em] uppercase opacity-60">Exclusive Deal</span>
                    <span className="text-lg md:text-xl font-bold font-headline tracking-tighter">{storeName}</span>
                </div>
                <div className="size-10" />
            </header>

            <main className="pt-20 md:pt-24 px-4 md:px-6 max-w-4xl mx-auto space-y-8 md:space-y-12 pb-20">
                {/* Hero Card */}
                <div className="relative isolate overflow-hidden bg-primary-container asymmetric-leaf-lg aspect-[4/3] md:aspect-[16/9] shadow-2xl">
                    <img 
                        src={offer.mainImage || '/placeholder.png'} 
                        className="absolute inset-0 size-full object-cover mix-blend-overlay opacity-60" 
                        alt="" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent flex flex-col justify-end p-6 md:p-12">
                        <div className="space-y-4 md:space-y-6 max-w-2xl">
                            {percent > 0 && (
                                <div className="flex items-center gap-2 bg-white text-primary px-4 md:px-6 py-2 rounded-full w-fit font-black uppercase tracking-widest text-sm md:text-lg shadow-xl animate-pulse">
                                    <Sparkles size={16} className="md:size-6" />
                                    <span>{percent}% OFF</span>
                                </div>
                            )}
                            <h1 className="text-3xl md:text-5xl font-headline font-black tracking-tight leading-[1.05]">
                                {offer.name}
                            </h1>
                            <p className="text-base md:text-lg text-white/80 font-medium leading-relaxed">
                                {offer.description}
                            </p>
                        </div>
                    </div>
                    {/* Floating Glow */}
                    <div className="absolute -top-24 -right-24 size-96 bg-primary/30 rounded-full blur-[120px] -z-10" />
                </div>

                {/* Offer Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-12">
                        {/* Items in the bundle */}
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] opacity-60">What's in the bundle</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                {offer.items.map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => setPreviewItem(item)}
                                        className="group bg-white/5 border border-white/10 rounded-2xl md:rounded-[1.5rem] p-4 md:p-5 hover:bg-white/10 transition-all cursor-pointer active:scale-95"
                                    >
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="size-14 md:size-16 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl shrink-0">
                                                <img src={item.mainImage || '/placeholder.png'} className="size-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-base md:text-lg font-black group-hover:text-primary transition-colors">{item.name}</p>
                                                <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-60">
                                                    {item.category?.name || (item.itemType === 'service' ? 'Service' : 'Product')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why this offer */}
                        <div className="grid grid-cols-3 gap-3 md:gap-4">
                            <div className="p-4 md:p-6 bg-white text-slate-900 rounded-2xl md:rounded-[1.5rem] space-y-2 md:space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                                <Flame className="text-primary size-6 md:size-8" />
                                <div className="space-y-1">
                                    <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Demand</h4>
                                    <p className="text-sm md:text-lg font-black">Limited</p>
                                </div>
                            </div>
                            <div className="p-4 md:p-6 bg-primary text-white rounded-2xl md:rounded-[1.5rem] space-y-2 md:space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                                <Sparkles className="size-6 md:size-8" />
                                <div className="space-y-1">
                                    <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Rewards</h4>
                                    <p className="text-sm md:text-lg font-black">+{offer.loyaltyPoints || 0} Pts</p>
                                </div>
                            </div>
                            <div className="p-4 md:p-6 bg-white/10 border border-white/10 rounded-2xl md:rounded-[1.5rem] space-y-2 md:space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
                                <ShieldCheck className="text-emerald-400 size-6 md:size-8" />
                                <div className="space-y-1">
                                    <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Value</h4>
                                    <p className="text-sm md:text-lg font-black">Best</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="lg:sticky lg:top-32 h-fit space-y-6">
                        <div className="bg-white text-slate-900 p-6 md:p-7 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl space-y-6 md:space-y-7">
                            <div className="space-y-3">
                                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-outline text-center">Exclusive Pricing</p>
                                <div className="space-y-2 text-center">
                                    <div className="flex items-center justify-center gap-3">
                                        <p className="text-lg md:text-xl text-slate-400 line-through font-bold">{formatPrice(originalPrice)}</p>
                                        <p className="text-sm md:text-base bg-primary text-white px-3 py-1 rounded-full font-black">-{percent}%</p>
                                    </div>
                                    <p className="text-4xl md:text-5xl font-black text-slate-900 font-display">{formatPrice(offer.calculatedPrice)}</p>
                                    <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-widest pt-1">Total Savings: {formatPrice(savings)}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleClaim}
                                disabled={isSubmitting}
                                className="group relative w-full h-14 bg-slate-900 text-white text-base font-black rounded-xl shadow-xl hover:bg-black hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 uppercase tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                     <>
                                         <Gift size={22} />
                                         <span>Claim Now</span>
                                     </>
                                )}
                            </button>
                            
                            <p className="text-[10px] text-center font-bold text-outline uppercase tracking-widest">Limited quantity available</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-slate-900 border-t border-white/10 z-[100] md:hidden">
                <button
                    onClick={handleClaim}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                        <>
                            <Gift size={18} />
                            Claim Offer — {formatPrice(offer.calculatedPrice)}
                        </>
                    )}
                </button>
            </div>

            {/* Item Preview Modal */}
            <AnimatePresence>
                {previewItem && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewItem(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-surface text-on-surface rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <button 
                                onClick={() => setPreviewItem(null)}
                                className="absolute top-4 right-4 z-10 size-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all"
                            >
                                <X size={20} className="text-white" />
                            </button>

                            <div className="overflow-y-auto no-scrollbar">
                                <div className="relative aspect-video w-full">
                                    <img 
                                        src={previewItem.mainImage || '/placeholder.png'} 
                                        alt={previewItem.name}
                                        className="size-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                                            {previewItem.category?.name || (previewItem.itemType === 'service' ? 'Service' : 'Product')}
                                        </span>
                                        <h2 className="text-2xl md:text-3xl font-headline font-black text-white tracking-tight leading-tight">
                                            {previewItem.name}
                                        </h2>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 space-y-6">
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Description</h4>
                                        <p className="text-sm md:text-base leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">
                                            {previewItem.description || previewItem.shortDescription || 'No description available for this item.'}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => setPreviewItem(null)}
                                        className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs"
                                    >
                                        Back to Offer
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
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <div className="relative w-full max-w-lg">
                            <StepForm 
                                storeName={storeName}
                                logoUrl={logoUrl}
                                customWelcomeTitle="Claim This Offer"
                                customWelcomeMessage="Verify your details to unlock this exclusive pricing."
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
