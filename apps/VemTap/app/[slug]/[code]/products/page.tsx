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
    X,
    LayoutGrid,
    List
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    useCatalogueItemsPublic, 
    CatalogueItem, 
    useCreateCatalogueOrder,
    useCatalogueCategoriesPublic 
} from '@/services/catalogue/hooks';
import { cn, formatPrice } from '@/lib/utils';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [qty, setQty] = useState(1);
    const [pendingOrder, setPendingOrder] = useState<{product: CatalogueItem, qty: number} | null>(null);

    // Reset qty when product changes
    React.useEffect(() => {
        if (selectedProduct) setQty(1);
    }, [selectedProduct]);

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

            <main className="pt-20 md:pt-24 px-4 md:px-6 max-w-4xl mx-auto space-y-8 md:space-y-10">
                {/* Search & Header */}
                <section className="space-y-4 md:space-y-6">
                    <h1 className="text-2xl md:text-5xl font-headline font-extrabold text-on-surface leading-[1.1] tracking-tight">
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
                        <div className="flex bg-white p-1 rounded-2xl shadow-sm self-stretch sm:self-auto">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2",
                                    viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-outline hover:bg-slate-50"
                                )}
                            >
                                <LayoutGrid size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Grid</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "flex-1 sm:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2",
                                    viewMode === 'list' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-outline hover:bg-slate-50"
                                )}
                            >
                                <List size={18} />
                                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">List</span>
                            </button>
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
                <section className={cn(
                    "grid gap-4 sm:gap-8",
                    viewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
                )}>
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => router.push(`/${params.slug}/${params.code}/products/${product.id}`)}
                            className={cn(
                                "bg-white asymmetric-leaf shadow-xl hover:shadow-2xl transition-all group border border-slate-50 cursor-pointer overflow-hidden",
                                viewMode === 'grid' ? "p-3 md:p-6" : "p-3 md:p-6 flex gap-4 md:gap-8 items-center"
                            )}
                        >
                            <div className={cn(
                                "rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 overflow-hidden relative",
                                viewMode === 'grid' ? "w-full aspect-square mb-4" : "size-20 sm:size-24"
                            )}>
                                {product.mainImage ? (
                                    <img 
                                        src={product.mainImage} 
                                        alt={product.name}
                                        className="size-full object-cover transition-transform duration-700"
                                    />
                                ) : (
                                    <ShoppingBag size={viewMode === 'grid' ? 48 : 32} strokeWidth={2} />
                                )}
                                {product.loyaltyPoints && product.loyaltyPoints > 0 && (
                                    <div className={cn(
                                        "absolute top-2 left-2 sm:top-4 sm:left-4 bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-1 shadow-lg z-10",
                                        viewMode === 'grid' ? "px-2 py-1 text-[8px] sm:px-3 sm:py-1.5 sm:text-[10px]" : "px-2 py-1 text-[8px] sm:px-3 sm:py-1.5 sm:text-[10px]"
                                    )}>
                                        <Star size={viewMode === 'grid' ? 10 : 12} fill="currentColor" />
                                        +{product.loyaltyPoints} {viewMode === 'grid' ? 'Pts' : 'Points'}
                                    </div>
                                )}
                                {viewMode === 'grid' && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProduct(product);
                                        }}
                                        className="absolute bottom-2 right-2 size-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                )}
                            </div>
                            <div className={cn(
                                "flex flex-col gap-1",
                                viewMode === 'list' && "flex-grow"
                            )}>
                                <div className={cn(
                                    "flex justify-between items-start",
                                    viewMode === 'list' ? "flex-col sm:flex-row sm:items-center gap-1" : "flex-col gap-1"
                                )}>
                                    <h3 className={cn(
                                        "font-headline font-bold text-on-surface group-hover:text-primary transition-colors truncate pr-2",
                                        viewMode === 'grid' ? "text-sm md:text-xl w-full" : "text-lg md:text-2xl"
                                    )}>
                                        {product.name}
                                    </h3>
                                    <span className={cn(
                                        "text-primary font-black whitespace-nowrap",
                                        viewMode === 'grid' ? "text-xs md:text-lg" : "text-base md:text-2xl"
                                    )}>{formatPrice(product.price)}</span>
                                </div>
                                <p className={cn(
                                    "text-outline text-sm font-medium",
                                    viewMode === 'grid' ? "line-clamp-1" : "line-clamp-2"
                                )}>{product.description}</p>
                                
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            {product.category?.name || 'General'}
                                        </span>
                                    </div>
                                    {viewMode === 'list' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedProduct(product);
                                            }}
                                            className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-colors"
                                        >
                                            Order Now
                                        </button>
                                    )}
                                </div>
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
                            className="relative w-full max-w-2xl bg-white rounded-t-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
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

                                <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                                    <div className="space-y-1 md:space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {selectedProduct.category?.name || 'General'}
                                            </span>
                                            {selectedProduct.loyaltyPoints && selectedProduct.loyaltyPoints > 0 && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                                                    <Star size={8} className="md:size-[10px]" fill="currentColor" />
                                                    {selectedProduct.loyaltyPoints} Points
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl md:text-3xl font-headline font-black text-on-surface tracking-tight">
                                            {selectedProduct.name}
                                        </h2>
                                        <p className="text-2xl md:text-4xl font-black text-primary">{formatPrice(selectedProduct.price)}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-outline">Product Description</h4>
                                        <p className="text-slate-600 font-medium leading-relaxed">
                                            {selectedProduct.description}
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-outline">Select Quantity</h4>
                                        <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl w-fit">
                                            <button 
                                                onClick={() => setQty(Math.max(1, qty - 1))}
                                                className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="w-12 text-center text-xl font-black">{qty}</span>
                                            <button 
                                                onClick={() => setQty(qty + 1)}
                                                className="size-12 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
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
                                        onClick={() => handleOrder(selectedProduct, qty)}
                                        disabled={isSubmitting}
                                        className="w-full h-16 md:h-20 bg-primary text-white text-lg md:text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-70 uppercase tracking-widest"
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
