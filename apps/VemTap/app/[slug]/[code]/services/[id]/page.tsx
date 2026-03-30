'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Star, 
    Clock, 
    ShieldCheck, 
    Calendar,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    MapPin,
    CheckCircle2
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

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const { data: service, isLoading } = useCatalogueItem(params.id as string, branchId || undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleBooking = async () => {
        if (!service) return;

        const executeBooking = async (currentUser: User) => {
            setIsSubmitting(true);
            try {
                await createOrderMutation.mutateAsync({
                    branchId: branchId!,
                    deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                    firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                    lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                    email: currentUser.email || undefined,
                    phone: currentUser.phone || 'N/A',
                    items: [{ itemId: service.id, quantity: 1 }]
                });
                toast.success('Service booked successfully!', { icon: '📅' });
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to book service');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setShowAuthForm(true);
        } else {
            executeBooking(user as User);
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
                    items: [{ itemId: service!.id, quantity: 1 }]
                });
                toast.success('Service booked successfully!', { icon: '📅' });
                router.push(`/${params.slug}/${params.code}/success`);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Authentication failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !service) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    const images = [service.mainImage, ...(service.galleryImages || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface pb-32">
            {/* Header / Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <header className="absolute top-0 left-0 w-full px-6 py-8 flex justify-between items-center z-30">
                    <button onClick={() => router.back()} className="size-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-2xl hover:bg-white hover:text-slate-900 transition-all">
                        <ArrowLeft size={28} />
                    </button>
                    <div className="bg-white/20 backdrop-blur-xl px-6 py-2 rounded-2xl text-white font-black font-headline tracking-widest text-sm border border-white/20 uppercase">
                        {storeName}
                    </div>
                    <div className="size-14" />
                </header>

                <AnimatePresence mode="wait">
                    <motion.div 
                        key={activeImageIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        {images.length > 0 ? (
                            <img src={images[activeImageIndex]} alt="" className="size-full object-cover shadow-2xl" />
                        ) : (
                            <div className="size-full bg-slate-900 flex items-center justify-center text-white/50">
                                <Calendar size={120} strokeWidth={1} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
                        {images.map((_, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "transition-all rounded-full shadow-lg",
                                    activeImageIndex === idx ? "w-10 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <main className="relative -mt-32 px-6 max-w-4xl mx-auto z-40 pb-20">
                <div className="bg-white asymmetric-leaf p-8 sm:p-14 shadow-2xl border border-slate-50 space-y-12">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] rounded-full">
                                    {service.category?.name || 'Exclusive Service'}
                                </span>
                                <h1 className="text-4xl sm:text-6xl font-headline font-black text-on-surface tracking-tight leading-[1.1]">
                                    {service.name}
                                </h1>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-outline uppercase tracking-widest">Pricing Policy</p>
                                <p className="text-5xl font-black text-primary font-display">{formatPrice(service.price)}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-4">
                            <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-slate-600">
                                <Clock size={20} className="text-primary" />
                                <span className="text-xs font-black uppercase tracking-widest">Instant Booking</span>
                            </div>
                            <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-slate-600">
                                <ShieldCheck size={20} className="text-emerald-500" />
                                <span className="text-xs font-black uppercase tracking-widest">Premium quality</span>
                            </div>
                            {service.loyaltyPoints && service.loyaltyPoints > 0 && (
                                <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 rounded-2xl text-amber-600">
                                    <Star size={20} fill="currentColor" />
                                    <span className="text-xs font-black uppercase tracking-widest">+{service.loyaltyPoints} Reward Points</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="md:col-span-2 space-y-6">
                            <h4 className="text-xs font-black uppercase tracking-[0.4em] text-outline">What to expect</h4>
                            <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                {service.description}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                                {[
                                    'Professional Consultants',
                                    'Same Day Service Available',
                                    'Personalized Experience',
                                    'Verified Provider'
                                ].map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Provider Info</h5>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                        <MapPin size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-widest truncate">{storeName}</p>
                                        <p className="text-[10px] font-bold text-outline">Active provider</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleBooking}
                                disabled={isSubmitting}
                                className="group w-full h-16 bg-slate-900 text-white text-lg font-black rounded-2xl shadow-xl hover:bg-black hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 uppercase tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <Calendar size={20} />
                                        <span>Secure Booking</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-[100] md:hidden">
                <button
                    onClick={handleBooking}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                        <>
                            <Calendar size={18} />
                            Book Now — {formatPrice(service.price)}
                        </>
                    )}
                </button>
            </div>

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
                                customWelcomeTitle="Secure Your Spot"
                                customWelcomeMessage="Share your contact info to confirm your booking instantly."
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
