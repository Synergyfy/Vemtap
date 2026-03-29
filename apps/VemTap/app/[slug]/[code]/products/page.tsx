'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    SlidersHorizontal, 
    ShoppingBag, 
    ArrowLeft, 
    Plus, 
    Minus, 
    Star, 
    Clock, 
    ShieldCheck,
    Loader2,
    ChevronRight,
    X
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

export default function ProductsPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedProduct, setSelectedProduct] = useState<CatalogueItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [pendingOrder, setPendingOrder] = useState<{product: CatalogueItem, qty: number} | null>(null);

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: categoriesData } = useCatalogueCategoriesPublic(branchId || '');
    const { data: catalogueResponse, isLoading } = useCatalogueItemsPublic(branchId || '', {
        itemType: 'product',
        search: debouncedSearch,
        categoryId: selectedCategory === 'All' ? undefined : selectedCategory,
        sortBy,
        limit: 50
    });

    const products = catalogueResponse?.data || [];

    const categories = useMemo(() => 
        [{ id: 'All', name: 'All' }, ...(categoriesData || [])],
    [categoriesData]);

    const createOrderMutation = useCreateCatalogueOrder();

    const handleOrder = async (product: CatalogueItem, qty: number) => {
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
                    items: [{ itemId: product.id, quantity: qty }]
                });
                toast.success('Order placed successfully!', { icon: '🎉' });
                setSelectedProduct(null);
                router.push(`/${params.slug}/${params.code}/success`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to place order');
            } finally {
                setIsSubmitting(false);
            }
        };

        if (!isAuthenticated) {
            setPendingOrder({ product, qty });
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
                if (pendingOrder) {
                    await handleOrder(pendingOrder.product, pendingOrder.qty);
                    setPendingOrder(null);
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
            {/* Top Bar */}
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

            <main className="pt-24 px-6 max-w-4xl mx-auto space-y-10">
                {/* Search & Header */}
                <section className="space-y-6">
                    <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight">
                        Our <span className="bg-gradient-to-r from-primary to-secondary-container bg-clip-text text-transparent">Premium Menu</span>
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search products..."
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

                {/* Products Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setSelectedProduct(product)}
                            className="bg-white p-6 asymmetric-leaf shadow-xl hover:shadow-2xl transition-all group border border-slate-50 cursor-pointer"
                        >
                            <div className="w-full aspect-square rounded-2xl overflow-hidden mb-6 bg-slate-50 relative">
                                <img 
                                    src={product.mainImage || '/placeholder.png'} 
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                {product.loyaltyPoints && product.loyaltyPoints > 0 && (
                                    <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                                        <Star size={12} fill="currentColor" />
                                        +{product.loyaltyPoints} Pts
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-headline font-bold text-xl text-on-surface group-hover:text-primary transition-colors truncate pr-4">
                                        {product.name}
                                    </h3>
                                    <span className="text-primary font-black text-lg">₦{Number(product.price).toLocaleString()}</span>
                                </div>
                                <p className="text-outline text-sm line-clamp-2 font-medium">{product.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {products.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <ShoppingBag size={48} className="mx-auto text-slate-200" />
                        <p className="text-outline font-bold">No products found matching your criteria.</p>
                    </div>
                )}
            </main>

            <PremiumBottomNav />

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="relative w-full max-w-2xl bg-white rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                        >
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-6 right-6 z-10 size-12 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="overflow-y-auto no-scrollbar">
                                <div className="relative aspect-[4/3] w-full">
                                    <img 
                                        src={selectedProduct.mainImage || '/placeholder.png'} 
                                        alt={selectedProduct.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {selectedProduct.category?.name || 'General'}
                                            </span>
                                            {selectedProduct.loyaltyPoints && selectedProduct.loyaltyPoints > 0 && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                                    <Star size={10} fill="currentColor" />
                                                    {selectedProduct.loyaltyPoints} Points
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-headline font-black text-on-surface tracking-tight">
                                            {selectedProduct.name}
                                        </h2>
                                        <p className="text-4xl font-black text-primary">₦{Number(selectedProduct.price).toLocaleString()}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-outline">Product Description</h4>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                            {selectedProduct.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-surface rounded-2xl flex items-center gap-3">
                                            <ShieldCheck className="text-primary" size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Quality Guaranteed</span>
                                        </div>
                                        <div className="p-4 bg-surface rounded-2xl flex items-center gap-3">
                                            <Clock className="text-orange-500" size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Fast Delivery</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOrder(selectedProduct, 1)}
                                        disabled={isSubmitting}
                                        className="w-full h-20 bg-primary text-white text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : (
                                            <>
                                                <ShoppingBag size={24} />
                                                Order Now
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
                                customWelcomeTitle="Quick Verification"
                                customWelcomeMessage="Please share your details to complete your order."
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
