'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Star, 
    ShieldCheck, 
    Truck, 
    RotateCcw,
    ShoppingBag,
    Loader2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Package
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueItem, 
    useCreateCatalogueOrder 
} from '@/services/catalogue/hooks';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { api } from '@/lib/api';
import { User } from '@/store/useAuthStore';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const { data: product, isLoading } = useCatalogueItem(params.id as string, branchId || undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleOrder = async () => {
        if (!product) return;

        const executeOrder = async (currentUser: User) => {
            setIsSubmitting(true);
            try {
                await createOrderMutation.mutateAsync({
                    branchId: branchId!,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [{ itemId: product.id, quantity }]
                });
                toast.success('Order placed successfully!', { icon: '🛍️' });
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to place order');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setShowAuthForm(true);
        } else {
            executeOrder(user as User);
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
                // Trigger order after auth
                const currentUser = authResponse.user as User;
                await createOrderMutation.mutateAsync({
                    branchId: branchId!,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [{ itemId: product!.id, quantity }]
                });
                toast.success('Order placed successfully!', { icon: '🛍️' });
                router.push(`/${params.slug}/${params.code}/success`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !product) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    const images = [product.mainImage, ...(product.galleryImages || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
            <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
                <header className="absolute top-0 left-0 w-full px-6 py-6 md:py-8 flex justify-between items-center z-30">
                    <button onClick={() => router.back()} className="size-12 md:size-14 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-2xl hover:bg-white hover:text-slate-900 transition-all">
                        <ArrowLeft size={24} className="md:size-28" />
                    </button>
                    <div className="bg-white/20 backdrop-blur-xl px-4 md:px-6 py-2 rounded-xl md:rounded-2xl text-white font-black font-headline tracking-widest text-[10px] md:text-sm border border-white/20 uppercase">
                        {storeName}
                    </div>
                    <div className="size-10" /> {/* Spacer */}
                </header>

                <AnimatePresence mode="wait">
                    <motion.img 
                        key={activeImageIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                        src={images[activeImageIndex]} 
                        alt={product.name}
                        className="size-full object-cover"
                    />
                </AnimatePresence>
            </div>

            <main className="relative -mt-24 md:-mt-32 px-4 md:px-6 max-w-4xl mx-auto z-40 pb-20">
                <div className="bg-white asymmetric-leaf p-5 md:p-14 shadow-2xl border border-slate-50 space-y-10 md:space-y-12">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
                            <div className="space-y-1 md:space-y-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                    {product.category?.name || 'Exclusive Product'}
                                </span>
                                <h1 className="text-2xl md:text-6xl font-headline font-black text-on-surface tracking-tight leading-[1.1]">
                                    {product.name}
                                </h1>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] md:text-sm font-black text-outline uppercase tracking-widest">Premium Price</p>
                                <p className="text-3xl md:text-5xl font-black text-primary font-display">{formatPrice(product.price)}</p>
                            </div>
                        </div>

                        <p className="text-base md:text-xl text-slate-600 font-medium leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-white p-2 rounded-3xl shadow-sm border border-slate-50 w-fit">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <span className="w-16 text-center text-2xl font-black">{quantity}</span>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <button
                            onClick={handleOrder}
                            disabled={isSubmitting}
                            className="group relative w-full h-16 bg-slate-900 text-white text-lg font-black rounded-2xl shadow-xl hover:bg-black hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 uppercase tracking-widest"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <ShoppingBag size={22} />
                                    Order Now
                                    <div className="absolute right-6 size-8 bg-white/10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                        <ChevronRight size={16} />
                                    </div>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Features/Trust badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-4 group">
                            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <ShieldCheck size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Verified Quality</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="size-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Truck size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Fast Express Delivery</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="size-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <RotateCcw size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-outline">Easy Returns Policy</span>
                        </div>
                    </div>
                </div>
            </main>

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
                                customWelcomeTitle="Reserve This Item"
                                customWelcomeMessage="Please share your contact details to complete your order."
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
