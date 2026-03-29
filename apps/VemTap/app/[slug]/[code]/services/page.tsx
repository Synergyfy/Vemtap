'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Calendar, 
    ArrowLeft, 
    Star, 
    Clock, 
    ShieldCheck,
    Loader2,
    ChevronRight,
    X,
    SlidersHorizontal
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueItemsPublic, 
    CatalogueItem, 
    useCreateCatalogueOrder,
    useCatalogueCategoriesPublic 
} from '@/services/catalogue/hooks';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PremiumBottomNav } from '@/components/visitor/PremiumBottomNav';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { api } from '@/lib/api';
import { User } from '@/store/useAuthStore';

export default function ServicesPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedService, setSelectedService] = useState<CatalogueItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [pendingBooking, setPendingBooking] = useState<{service: CatalogueItem, qty: number} | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: categoriesData } = useCatalogueCategoriesPublic(branchId || '');
    const { data: catalogueResponse, isLoading } = useCatalogueItemsPublic(branchId || '', {
        itemType: 'service',
        search: debouncedSearch,
        categoryId: selectedCategory === 'All' ? undefined : selectedCategory,
        sortBy,
        limit: 50
    });

    const services = catalogueResponse?.data || [];

    const categories = useMemo(() => 
        [{ id: 'All', name: 'All' }, ...(categoriesData || [])],
    [categoriesData]);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleBooking = async (service: CatalogueItem, qty: number) => {
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
                    items: [{ itemId: service.id, quantity: qty }]
                });
                toast.success('Service booked successfully!', { icon: '📅' });
                setSelectedService(null);
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to book service');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setPendingBooking({ service, qty });
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
                if (pendingBooking) {
                    await handleBooking(pendingBooking.service, pendingBooking.qty);
                    setPendingBooking(null);
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
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight">
                        Expert <span className="bg-gradient-to-r from-tertiary to-secondary bg-clip-text text-transparent">Professional Services</span>
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                            />
                        </div>
                        <div className="relative shrink-0">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-full pl-4 pr-10 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm font-bold text-slate-600 appearance-none cursor-pointer min-w-[160px]"
                            >
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Lowest</option>
                                <option value="price_desc">Price: Highest</option>
                            </select>
                            <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" size={18} />
                        </div>
                    </div>

                </section>

                {/* Categories */}
                <section className="overflow-hidden -mx-6">
                    <div className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm border whitespace-nowrap",
                                    selectedCategory === cat.id 
                                        ? "bg-primary text-white border-primary shadow-primary/20 scale-105" 
                                        : "bg-white text-outline border-slate-100 hover:border-primary/20"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="space-y-6">
                    {services.map((service) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => setSelectedService(service)}
                            className="flex items-center gap-6 bg-white p-6 asymmetric-leaf shadow-xl hover:translate-x-2 transition-transform cursor-pointer border border-slate-50 group"
                        >
                            <div className="size-16 sm:size-20 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 overflow-hidden">
                                {service.mainImage ? (
                                    <img src={service.mainImage} alt={service.name} className="size-full object-cover" />
                                ) : (
                                    <Calendar size={32} strokeWidth={2.5} />
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className="font-headline font-bold text-on-surface text-xl truncate">{service.name}</h4>
                                <p className="text-on-surface-variant text-sm font-medium line-clamp-1">{service.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-primary font-black">₦{Number(service.price).toLocaleString()}</span>
                                    {service.loyaltyPoints && service.loyaltyPoints > 0 && (
                                        <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                                            <Star size={12} fill="currentColor" />
                                            +{service.loyaltyPoints} Pts
                                        </span>
                                    )}
                                </div>
                            </div>
                            <ChevronRight className="text-outline group-hover:text-primary transition-colors shrink-0" size={24} />
                        </motion.div>
                    ))}

                    {services.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <Calendar size={48} className="mx-auto text-slate-200" />
                            <p className="text-outline font-bold">No services found.</p>
                        </div>
                    )}
                </section>
            </main>

            <PremiumBottomNav />

            {/* Service Detail Modal */}
            <AnimatePresence>
                {selectedService && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedService(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-2xl bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <button 
                                onClick={() => setSelectedService(null)}
                                className="absolute top-6 right-6 z-10 size-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="overflow-y-auto no-scrollbar p-8 space-y-10">
                                <div className="space-y-4 text-center">
                                    <div className="size-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6">
                                        {selectedService.mainImage ? (
                                            <img src={selectedService.mainImage} alt={selectedService.name} className="size-full object-cover rounded-[2rem]" />
                                        ) : (
                                            <Calendar size={48} strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">
                                            {selectedService.name}
                                        </h2>
                                        <div className="flex justify-center items-center gap-4">
                                            <p className="text-3xl font-black text-primary">₦{Number(selectedService.price).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-outline text-center">Service Overview</h4>
                                    <p className="text-slate-600 font-medium leading-relaxed text-center text-lg">
                                        {selectedService.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-surface rounded-3xl flex flex-col items-center gap-3 text-center">
                                        <ShieldCheck className="text-primary" size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Certified Experts</span>
                                    </div>
                                    <div className="p-6 bg-surface rounded-3xl flex flex-col items-center gap-3 text-center">
                                        <Clock className="text-tertiary" size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Same Day Booking</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBooking(selectedService, 1)}
                                    disabled={isSubmitting}
                                    className="w-full h-20 bg-slate-900 text-white text-xl font-black rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            <Calendar size={24} />
                                            Confirm Booking
                                        </>
                                    )}
                                </button>
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
                                customWelcomeTitle="Almost There"
                                customWelcomeMessage="Please share your contact info to secure your booking."
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
