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
    SlidersHorizontal,
    LayoutGrid,
    List,
    ShoppingCart
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueItemsPublic, 
    CatalogueItem, 
    useCreateCatalogueOrder,
    useCatalogueCategoriesPublic 
} from '@/services/catalogue/hooks';
import { useAddToCart } from '@/services/catalogue-cart/hooks';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useCartMergeOnLogin } from '@/hooks/useCartMergeOnLogin';
import { cn, formatPrice } from '@/lib/utils';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [pendingBooking, setPendingBooking] = useState<{service: CatalogueItem, qty: number} | null>(null);

    // Cart
    const addToCartMutation = useAddToCart();
    const guestCartStore = useGuestCartStore();
    useCartMergeOnLogin(branchId);

    const handleAddToCart = (item: CatalogueItem, quantity = 1) => {
        if (isAuthenticated) {
            addToCartMutation.mutate(
                { branchId: branchId!, itemId: item.id, quantity },
                { onSuccess: () => toast.success(`${item.name} added to cart!`, { icon: '🛒' }) }
            );
        } else {
            guestCartStore.addItem({
                branchId: branchId!,
                itemId: item.id,
                quantity,
                name: item.name,
                price: Number(item.price),
                image: item.mainImage ?? undefined,
                itemType: 'service',
            });
            toast.success(`${item.name} added to cart!`, { icon: '🛒' });
        }
    };

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
            <header className="fixed top-0 left-0 w-full flex justify-between items-center px-4 md:px-6 py-3 md:py-4 bg-surface/70 backdrop-blur-xl z-50">
                <div className="flex items-center gap-2 md:gap-3">
                    <button onClick={() => router.push(`/${params.slug}/${params.code}`)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={18} className="md:size-6" />
                    </button>
                    <span className="text-base md:text-xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline tracking-tight">
                        {storeName}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                    >
                        <SlidersHorizontal size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filter</span>
                        { (searchQuery || selectedCategory !== 'All' || sortBy !== 'newest') && (
                            <div className="size-1.5 bg-secondary rounded-full animate-pulse" />
                        )}
                    </button>
                </div>
            </header>

            <main className="pt-16 md:pt-20 px-4 md:px-6 max-w-4xl mx-auto space-y-4 md:space-y-6 flex flex-col">
                {/* Header Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-sm md:text-lg font-black font-headline uppercase tracking-widest text-on-surface">Premium Services</h1>
                        <span className="text-[10px] md:text-xs font-bold text-outline">({catalogueResponse?.total || 0})</span>
                    </div>
                </div>

                <section className={cn(
                    "grid gap-4 sm:gap-6",
                    viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
                )}>
                    {services.map((service) => (
                        <motion.div
                            key={service.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => router.push(`/${params.slug}/${params.code}/services/${service.id}`)}
                            className={cn(
                                "bg-white asymmetric-leaf shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-slate-50 group overflow-hidden",
                                viewMode === 'grid' ? "p-2 md:p-5 flex flex-col" : "p-4 md:p-6 flex items-center gap-4 md:gap-6"
                            )}
                        >
                            <div className={cn(
                                "rounded-lg md:rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 overflow-hidden relative",
                                viewMode === 'grid' ? "w-full aspect-[1.2] mb-2 md:mb-4" : "size-16 sm:size-20"
                            )}>
                                {service.mainImage ? (
                                    <img src={service.mainImage} alt={service.name} className="size-full object-cover" />
                                ) : (
                                    <Calendar size={viewMode === 'grid' ? 40 : 32} strokeWidth={2.5} />
                                )}
                                {service.loyaltyPoints && service.loyaltyPoints > 0 && (
                                    <span className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg z-10">
                                        <Star size={10} fill="currentColor" />
                                        +{service.loyaltyPoints}
                                    </span>
                                )}
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-primary text-[6px] md:text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm border border-primary/10">
                                        {service.category?.name || 'General'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className={cn(
                                    "font-headline font-bold text-on-surface truncate",
                                    viewMode === 'grid' ? "text-[12px] md:text-lg line-clamp-1" : "text-xl"
                                )}>{service.name}</h4>
                                <p className={cn(
                                    "text-on-surface-variant/70 font-medium mt-0.5 min-h-[1.2em]",
                                    viewMode === 'grid' ? "text-[9px] md:text-sm line-clamp-1" : "text-sm line-clamp-1"
                                )}>{service.description}</p>
                                <div className="flex flex-col gap-1 md:gap-3 mt-auto">
                                    <span className={cn(
                                        "text-primary font-black",
                                        viewMode === 'grid' ? "text-[11px] md:text-sm" : "text-base"
                                    )}>{formatPrice(service.price)}</span>
                                    
                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-2 gap-1 w-full mt-1">
                                            <button 
                                                className="py-1.5 bg-slate-100 text-slate-800 text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(service);
                                                }}
                                            >
                                                Cart
                                            </button>
                                            <button 
                                                className="py-1.5 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedService(service);
                                                }}
                                            >
                                                Book
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 w-full sm:w-auto mt-0.5 md:mt-0">
                                            <button 
                                                className="px-4 py-2 bg-slate-100 text-slate-800 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(service);
                                                }}
                                            >
                                                Add to Cart
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedService(service);
                                                }}
                                                className="px-4 py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {viewMode === 'list' && (
                                <ChevronRight className="text-outline group-hover:text-primary transition-colors shrink-0" size={24} />
                            )}
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

            {/* Service Detail Modal - (Optional: Kept for quick view if needed, but routing is preferred now) */}
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
                            className="relative w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <button 
                                onClick={() => setSelectedService(null)}
                                className="absolute top-6 right-6 z-10 size-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="overflow-y-auto no-scrollbar p-5 md:p-8 space-y-8 md:space-y-10">
                                <div className="space-y-4 text-center">
                                    <div className="size-24 bg-primary/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6">
                                        {selectedService.mainImage ? (
                                            <img src={selectedService.mainImage} alt={selectedService.name} className="size-full object-cover rounded-2xl md:rounded-[2rem]" />
                                        ) : (
                                            <Calendar size={48} strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl md:text-3xl font-headline font-black text-on-surface tracking-tight">
                                            {selectedService.name}
                                        </h2>
                                        <div className="flex justify-center items-center gap-4">
                                            <p className="text-2xl md:text-3xl font-black text-primary">{formatPrice(selectedService.price)}</p>
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
                                    <div className="p-4 md:p-6 bg-surface rounded-2xl md:rounded-3xl flex flex-col items-center gap-3 text-center">
                                        <ShieldCheck className="text-primary" size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Certified Experts</span>
                                    </div>
                                    <div className="p-4 md:p-6 bg-surface rounded-2xl md:rounded-3xl flex flex-col items-center gap-3 text-center">
                                        <Clock className="text-tertiary" size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Same Day Booking</span>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => selectedService && handleAddToCart(selectedService)}
                                        className="flex-1 h-14 md:h-16 bg-slate-100 text-slate-800 text-sm md:text-base font-black rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        <ShoppingCart size={20} />
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => handleBooking(selectedService, 1)}
                                        disabled={isSubmitting}
                                        className="flex-[1.5] h-14 md:h-16 bg-slate-900 text-white text-sm md:text-base font-black rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <Calendar size={24} />
                                                Book Now
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isFilterOpen && (
                    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-lg bg-surface rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 md:p-8 space-y-8 max-h-[85vh] overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl md:text-2xl font-black font-headline tracking-tight text-on-surface">Filter Services</h2>
                                    <button onClick={() => setIsFilterOpen(false)} className="size-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Search Services</h4>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="What service do you need?"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                                        />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Sort By</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'newest', name: 'Newest First' },
                                            { id: 'price_asc', name: 'Price: Low to High' },
                                            { id: 'price_desc', name: 'Price: High to Low' }
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                                    sortBy === opt.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-outline border-slate-100"
                                                )}
                                            >
                                                {opt.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Categories</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                                    selectedCategory === cat.id ? "bg-primary text-white border-primary" : "bg-white text-outline border-slate-100"
                                                )}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* View Mode */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Display View</h4>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                "flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-3 border",
                                                viewMode === 'grid' ? "bg-primary text-white border-primary" : "bg-white text-outline border-slate-100"
                                            )}
                                        >
                                            <LayoutGrid size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Grid View</span>
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-3 border",
                                                viewMode === 'list' ? "bg-primary text-white border-primary" : "bg-white text-outline border-slate-100"
                                            )}
                                        >
                                            <List size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">List View</span>
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs"
                                >
                                    Apply filters
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
