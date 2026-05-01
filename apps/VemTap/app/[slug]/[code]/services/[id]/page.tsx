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
import { BookingSystem } from '@/components/visitor/BookingSystem';

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const { data: service, isLoading } = useCatalogueItem(params.id as string, branchId || undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [pendingBookingDetails, setPendingBookingDetails] = useState<{ date: string, time: string } | null>(null);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleConfirmBooking = async (date: string, time: string) => {
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
                    items: [{ itemId: service.id, quantity: 1 }],
                    bookingDate: date,
                    bookingTime: time
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
            setPendingBookingDetails({ date, time });
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
            
            await api.post(`/visitors/signup`, { firstName, lastName, email: data.email, phone: data.phone || undefined });
            const authResponse = await api.post('/auth/login', { identifier: data.email, password: '123456' });

            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                setUserData(data);
                setShowAuthForm(false);
                
                if (pendingBookingDetails) {
                    const currentUser = authResponse.user as User;
                    await createOrderMutation.mutateAsync({
                        branchId: branchId!,
                        deviceId: useCustomerFlowStore.getState().deviceCode || undefined,
                        firstName: currentUser.firstName || currentUser.name?.split(' ')[0] || 'Guest',
                        lastName: currentUser.lastName || currentUser.name?.split(' ').slice(1).join(' ') || ' ',
                        email: currentUser.email || undefined,
                        phone: currentUser.phone || 'N/A',
                        items: [{ itemId: service!.id, quantity: 1 }],
                        bookingDate: pendingBookingDetails.date,
                        bookingTime: pendingBookingDetails.time
                    });
                    toast.success('Service booked successfully!', { icon: '📅' });
                    setPendingBookingDetails(null);
                    router.push(`/${params.slug}/${params.code}/success`);
                }
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
            <div className="relative h-[45vh] md:h-[60vh] w-full overflow-hidden">
                <header className="absolute top-0 left-0 w-full px-6 py-6 md:py-8 flex justify-between items-center z-30">
                    <button onClick={() => router.back()} className="size-12 md:size-14 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl flex items-center justify-center text-white border border-white/20 shadow-2xl hover:bg-white hover:text-slate-900 transition-all">
                        <ArrowLeft size={24} className="md:size-28" />
                    </button>
                    <div className="bg-white/20 backdrop-blur-xl px-4 md:px-6 py-2 rounded-xl md:rounded-2xl text-white font-black font-headline tracking-widest text-[10px] md:text-sm border border-white/20 uppercase">
                        {storeName}
                    </div>
                    <div className="size-10 md:size-14" />
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
            <main className="relative -mt-24 md:-mt-32 px-4 md:px-6 max-w-4xl mx-auto z-40 pb-20">
                <div className="bg-white asymmetric-leaf p-5 md:p-14 shadow-2xl border border-slate-50 space-y-10 md:space-y-12">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
                            <div className="space-y-1 md:space-y-2">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                                    {service.category?.name || 'Exclusive Service'}
                                </span>
                                <h1 className="text-2xl md:text-6xl font-headline font-black text-on-surface tracking-tight leading-[1.1]">
                                    {service.name}
                                </h1>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-[10px] md:text-sm font-black text-outline uppercase tracking-widest">Pricing Policy</p>
                                <p className="text-3xl md:text-5xl font-black text-primary font-display">{formatPrice(service.price)}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 md:gap-8 pt-2 md:pt-4">
                            <div className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-600">
                                <Clock size={16} className="md:size-20 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Instant Booking</span>
                            </div>
                            <div className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-slate-50 rounded-xl md:rounded-2xl text-slate-600">
                                <ShieldCheck size={16} className="md:size-20 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Premium quality</span>
                            </div>
                            {service.loyaltyPoints && service.loyaltyPoints > 0 && (
                                <div className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-amber-50 rounded-xl md:rounded-2xl text-amber-600">
                                    <Star size={16} className="md:size-20" fill="currentColor" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">+{service.loyaltyPoints} Rewards</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-12">
                        <div className="space-y-12">
                            <section className="space-y-6">
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
                            </section>

                            <hr className="border-slate-100" />

                            <section className="pt-4">
                                <BookingSystem 
                                    service={service} 
                                    onConfirm={handleConfirmBooking}
                                    isSubmitting={isSubmitting}
                                />
                            </section>
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
                                customWelcomeTitle="Almost Booked"
                                customWelcomeMessage="Please share your contact info to secure your spot for this service."
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
