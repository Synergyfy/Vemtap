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
import { 
    useCart, 
    useUpdateCartItem, 
    useRemoveCartItem 
} from '@/services/catalogue-cart/hooks';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useShallow } from 'zustand/react/shallow';
import { useCartMergeOnLogin } from '@/hooks/useCartMergeOnLogin';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PremiumBottomNav } from '@/components/visitor/PremiumBottomNav';
import { FloatingCartSummary } from '@/components/visitor/FloatingCartSummary';
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Default to grid
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [qty, setQty] = useState(1);
    const [pendingOrder, setPendingOrder] = useState<{product: CatalogueItem, qty: number} | null>(null);

    // Cart
    const addToCartMutation = useAddToCart();
    const updateItemMutation = useUpdateCartItem(branchId || '');
    const removeItemMutation = useRemoveCartItem(branchId || '');
    const { data: serverCart } = useCart(branchId);
    
    const guestItems = useGuestCartStore(
        useShallow((s) => (branchId ? s.getItemsForBranch(branchId) : []))
    );
    const guestCartStore = useGuestCartStore();
    useCartMergeOnLogin(branchId);

    const getCartQuantity = (itemId: string) => {
        if (isAuthenticated) {
            return serverCart?.items.find(i => i.itemId === itemId)?.quantity || 0;
        } else {
            return guestItems.find(i => i.itemId === itemId)?.quantity || 0;
        }
    };

    const handleUpdateQuantity = (item: CatalogueItem, delta: number) => {
        const currentQty = getCartQuantity(item.id);
        const newQty = currentQty + delta;
        
        if (isAuthenticated) {
            const cartItem = serverCart?.items.find(i => i.itemId === item.id);
            if (newQty <= 0 && cartItem) {
                removeItemMutation.mutate(cartItem.id);
            } else if (cartItem) {
                updateItemMutation.mutate({ cartItemId: cartItem.id, quantity: newQty });
            } else if (newQty > 0) {
                addToCartMutation.mutate({ branchId: branchId!, itemId: item.id, quantity: newQty });
            }
        } else {
            const guestItem = guestItems.find(i => i.itemId === item.id);
            if (guestItem) {
                guestCartStore.updateQuantity(guestItem.id, newQty);
            } else if (newQty > 0) {
                guestCartStore.addItem({
                    branchId: branchId!,
                    itemId: item.id,
                    quantity: newQty,
                    name: item.name,
                    price: Number(item.price),
                    image: item.mainImage ?? undefined,
                    itemType: 'product',
                });
            }
        }
    };

    // Reset qty when product changes
    React.useEffect(() => {
        if (selectedProduct) {
            const currentQty = getCartQuantity(selectedProduct.id);
            setQty(currentQty || 1);
        }
    }, [selectedProduct, serverCart, guestItems]);

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
                itemType: 'product',
            });
            toast.success(`${item.name} added to cart!`, { icon: '🛒' });
        }
    };

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
            
            await api.post(`/visitors/signup`, { firstName, lastName, email: data.email, phone: data.phone || undefined });
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
                        <h1 className="text-sm md:text-lg font-black font-headline uppercase tracking-widest text-on-surface">Explore items</h1>
                        <span className="text-[10px] md:text-xs font-bold text-outline">({catalogueResponse?.total || 0})</span>
                    </div>
                </div>

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
                                viewMode === 'grid' ? "p-2 md:p-5" : "p-3 md:p-6 flex gap-4 md:gap-8 items-center"
                            )}
                        >
                            <div className={cn(
                                "rounded-lg md:rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 overflow-hidden relative",
                                viewMode === 'grid' ? "w-full aspect-[1.1] mb-2 md:mb-4" : "size-20 sm:size-24"
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
                                        "absolute top-2 left-2 sm:top-4 sm:left-4 bg-amber-500 text-white rounded-lg font-black uppercase tracking-widest flex items-center gap-1 shadow-lg z-10",
                                        viewMode === 'grid' ? "px-2 py-1 text-[8px] sm:px-3 sm:py-1.5 sm:text-[10px]" : "px-2 py-1 text-[8px] sm:px-3 sm:py-1.5 sm:text-[10px]"
                                    )}>
                                        <Star size={viewMode === 'grid' ? 10 : 12} fill="currentColor" />
                                        +{product.loyaltyPoints} {viewMode === 'grid' ? 'Pts' : 'Points'}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="px-2 py-1 bg-white/90 backdrop-blur-md text-primary text-[6px] md:text-[9px] font-black uppercase tracking-widest rounded-md shadow-sm border border-primary/10">
                                        {product.category?.name || 'General'}
                                    </span>
                                </div>
                            </div>
                            <div className={cn(
                                "flex flex-col gap-0.5 md:gap-1",
                                viewMode === 'list' && "flex-grow"
                            )}>
                                <div className={cn(
                                    "flex justify-between items-start",
                                    viewMode === 'list' ? "flex-col sm:flex-row sm:items-center gap-1" : "flex-col gap-0 md:gap-1 flex-grow"
                                )}>
                                    <h3 className={cn(
                                        "font-headline font-bold text-on-surface group-hover:text-primary transition-colors truncate pr-2",
                                        viewMode === 'grid' ? "text-[12px] md:text-lg w-full line-clamp-1" : "text-lg md:text-2xl"
                                    )}>
                                        {product.name}
                                    </h3>
                                    <p className={cn(
                                        "text-on-surface-variant/70 font-medium mt-0.5 min-h-[1.2em]",
                                        viewMode === 'grid' ? "text-[9px] md:text-sm line-clamp-1" : "text-sm line-clamp-1"
                                    )}>{product.description}</p>
                                    <span className={cn(
                                        "text-primary font-black whitespace-nowrap mt-auto",
                                        viewMode === 'grid' ? "text-[11px] md:text-base" : "text-base md:text-2xl"
                                    )}>{formatPrice(product.price)}</span>
                                </div>
                                
                                {viewMode === 'grid' && (
                                    <div className="mt-2 h-8">
                                        {getCartQuantity(product.id) === 0 ? (
                                            <button 
                                                className="w-full h-full bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateQuantity(product, 1);
                                                }}
                                            >
                                                <Plus size={10} strokeWidth={4} />
                                                Add
                                            </button>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-between bg-slate-100 rounded-lg p-1 overflow-hidden">
                                                <button 
                                                    className="size-6 bg-white rounded-md flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateQuantity(product, -1);
                                                    }}
                                                >
                                                    <Minus size={10} strokeWidth={4} />
                                                </button>
                                                <span className="text-[10px] font-black">{getCartQuantity(product.id)}</span>
                                                <button 
                                                    className="size-6 bg-white rounded-md flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateQuantity(product, 1);
                                                    }}
                                                >
                                                    <Plus size={10} strokeWidth={4} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex items-center justify-between mt-1 md:mt-2">
                                    <div className="flex items-center gap-2">
                                        {/* Category tag moved to image overlay */}
                                    </div>
                                    {viewMode === 'list' && (
                                        <div className="h-10">
                                            {getCartQuantity(product.id) === 0 ? (
                                                <button 
                                                    className="px-6 h-full bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleUpdateQuantity(product, 1);
                                                    }}
                                                >
                                                    <Plus size={12} strokeWidth={4} />
                                                    Add to Cart
                                                </button>
                                            ) : (
                                                <div className="h-full flex items-center bg-slate-100 rounded-xl p-1 gap-4 overflow-hidden">
                                                    <button 
                                                        className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQuantity(product, -1);
                                                        }}
                                                    >
                                                        <Minus size={14} strokeWidth={4} />
                                                    </button>
                                                    <span className="text-sm font-black w-4 text-center">{getCartQuantity(product.id)}</span>
                                                    <button 
                                                        className="size-8 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateQuantity(product, 1);
                                                        }}
                                                    >
                                                        <Plus size={14} strokeWidth={4} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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

            {branchId && <FloatingCartSummary branchId={branchId} />}
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

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => {
                                                if (selectedProduct) {
                                                    const currentQty = getCartQuantity(selectedProduct.id);
                                                    if (currentQty === 0) {
                                                        handleUpdateQuantity(selectedProduct, qty);
                                                    } else {
                                                        handleUpdateQuantity(selectedProduct, qty - currentQty);
                                                    }
                                                    setSelectedProduct(null);
                                                    toast.success('Cart updated!');
                                                }
                                            }}
                                            className="flex-1 h-16 bg-primary text-white text-sm md:text-base font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                                        >
                                            <ShoppingCart size={20} />
                                            Update Cart
                                        </button>
                                    </div>
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
                                    <h2 className="text-xl md:text-2xl font-black font-headline tracking-tight text-on-surface">Filters & Sort</h2>
                                    <button onClick={() => setIsFilterOpen(false)} className="size-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Search Keyword</h4>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                                        <input 
                                            type="text" 
                                            placeholder="Find something delicious..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                                        />
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Order By</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'newest', name: 'Latest Arrivals' },
                                            { id: 'price_asc', name: 'Lowest Price' },
                                            { id: 'price_desc', name: 'Highest Price' }
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
