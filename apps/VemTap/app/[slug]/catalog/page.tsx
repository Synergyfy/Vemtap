'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, X, Search } from 'lucide-react';
import { useCatalogueItemsPublic, useCatalogueCategoriesPublic } from '@/services/catalogue/hooks';
import { useCart, useAddToCart, useUpdateCartItem, useRemoveCartItem, useCheckoutCart } from '@/services/catalogue-cart/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchContextByUsername } from '@/lib/api/devices';
import { formatNaira } from '@/components/home/mappers';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import OnboardingAuthModal from '@/components/public/OnboardingAuthModal';

export default function BusinessCatalogPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = params.slug as string;
    const typeFilter = searchParams.get('type') as 'product' | 'service' | null;

    const [activeTab, setActiveTab] = useState<'product' | 'service'>(typeFilter || 'product');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCart, setShowCart] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const { isAuthenticated } = useAuthStore();
    const [branchId, setBranchId] = useState('');

    useEffect(() => {
        const resolve = async () => {
            try {
                const ctx = await fetchContextByUsername(slug);
                if (ctx?.business?.id) setBranchId(ctx.business.id);
            } catch {
                // slug may not resolve
            }
        };
        resolve();
    }, [slug]);

    const { data: apiCategories } = useCatalogueCategoriesPublic(branchId);
    const { data: apiItems, isLoading: apiLoading } = useCatalogueItemsPublic(branchId, {
        search: searchQuery || undefined,
        itemType: activeTab,
    });

    const { data: cart } = useCart(branchId);
    const addToCart = useAddToCart();
    const updateCartItem = useUpdateCartItem(branchId);
    const removeCartItem = useRemoveCartItem(branchId);
    const checkoutCart = useCheckoutCart(branchId);

    const categories = useMemo(() => {
        if (apiCategories && apiCategories.length > 0) return apiCategories;
        return [];
    }, [apiCategories]);

    const items = useMemo(() => {
        return apiItems?.data || [];
    }, [apiItems]);

    const filteredItems = useMemo(() => {
        let result = items;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter((item) =>
                ((item.name as string) || '').toLowerCase().includes(q) ||
                ((item.shortDescription as string) || '').toLowerCase().includes(q)
            );
        }
        if (selectedCategory) {
            result = result.filter((item) => (item.categoryId as string) === selectedCategory);
        }
        return result;
    }, [items, searchQuery, selectedCategory]);

    const cartItems = cart?.items || [];
    const cartTotal = cart?.total || 0;
    const cartItemCount = cart?.itemCount || 0;

    const handleAddToCart = (item: Record<string, unknown>) => {
        if (!isAuthenticated) {
            setShowAuth(true);
            return;
        }
        if (!branchId) return;
        addToCart.mutate({
            branchId,
            itemId: item.id as string,
            quantity: 1,
        });
    };

    const handleUpdateQuantity = (cartItemId: string, currentQuantity: number, delta: number) => {
        const newQty = currentQuantity + delta;
        if (newQty <= 0) {
            removeCartItem.mutate(cartItemId);
        } else {
            updateCartItem.mutate({ cartItemId, quantity: newQty });
        }
    };

    const handleCheckout = () => {
        if (!branchId) return;
        checkoutCart.mutate(
            { branchId },
            {
                onSuccess: () => {
                    setShowCart(false);
                    router.push(`/${slug}`);
                },
            }
        );
    };

    const getItemQuantityInCart = (itemId: string) => {
        const cartItem = cartItems.find((ci) => ci.itemId === itemId);
        return cartItem?.quantity || 0;
    };

    const isLoading = apiLoading && branchId;

    return (
        <div className="min-h-screen bg-surface" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Fixed Header */}
            <header className="bg-surface border-b border-outline-variant fixed top-0 w-full z-50 flex items-center justify-between px-5 h-14">
                <button
                    onClick={() => router.back()}
                    aria-label="Go back"
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                >
                    <ArrowLeft size={20} className="text-primary" />
                </button>
                <h1 className="font-semibold text-base text-primary truncate mx-4">
                    {activeTab === 'product' ? 'Products' : 'Services'}
                </h1>
                <button
                    onClick={() => setShowCart(true)}
                    aria-label="Cart"
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors active:scale-95 relative"
                >
                    <ShoppingCart size={20} className="text-primary" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Main Content */}
            <main className="pt-14 pb-20 px-5 max-w-5xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 py-4 border-b border-outline-variant">
                    <button
                        onClick={() => setActiveTab('product')}
                        className={`flex-1 h-10 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === 'product'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-on-surface-variant hover:bg-gray-200'
                        }`}
                    >
                        Products
                    </button>
                    <button
                        onClick={() => setActiveTab('service')}
                        className={`flex-1 h-10 rounded-full font-semibold text-sm transition-colors ${
                            activeTab === 'service'
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-on-surface-variant hover:bg-gray-200'
                        }`}
                    >
                        Services
                    </button>
                </div>

                {/* Search */}
                <div className="py-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeTab === 'product' ? 'products' : 'services'}...`}
                            className="w-full pl-10 pr-4 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        />
                    </div>
                </div>

                {/* Categories */}
                {categories.length > 0 && (
                    <div className="flex gap-2 pb-4 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
                                !selectedCategory
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-on-surface-variant hover:bg-gray-200'
                            }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`shrink-0 px-4 h-8 rounded-full text-xs font-semibold transition-colors ${
                                    selectedCategory === cat.id
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-on-surface-variant hover:bg-gray-200'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Items Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-outline-variant overflow-hidden animate-pulse">
                                <div className="h-32 w-full bg-gray-200" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="h-8 bg-gray-200 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredItems.map((item: Record<string, unknown>) => {
                            const itemId = (item.id as string) || '';
                            const name = (item.name as string) || 'Item';
                            const price = (item.price as number) || 0;
                            const image = (item.image as string) || (item.mainImage as string) || '';
                            const desc = (item.shortDescription as string) || '';
                            const qtyInCart = getItemQuantityInCart(itemId);

                            return (
                                <div key={itemId} className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm">
                                    {image && (
                                        <div className="h-32 w-full bg-gray-100">
                                            <img src={image} alt={name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-3 flex flex-col gap-1">
                                        <h4 className="font-semibold text-sm text-on-surface truncate">{name}</h4>
                                        {desc && <p className="text-xs text-on-surface-variant line-clamp-1">{desc}</p>}
                                        <p className="text-base font-bold text-primary">{formatNaira(price)}</p>
                                        {qtyInCart > 0 ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(itemId, qtyInCart, -1)}
                                                    className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="font-semibold text-sm w-6 text-center">{qtyInCart}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(itemId, qtyInCart, 1)}
                                                    className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAddToCart(item)}
                                                disabled={addToCart.isPending}
                                                className="w-full h-8 mt-1 bg-primary text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50"
                                            >
                                                <Plus size={14} />
                                                Add to Cart
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!isLoading && filteredItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-on-surface-variant">No {activeTab === 'product' ? 'products' : 'services'} found.</p>
                    </div>
                )}
            </main>

            {/* Cart Drawer */}
            {showCart && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
                        {/* Cart Header */}
                        <div className="flex items-center justify-between px-5 h-14 border-b border-outline-variant">
                            <h2 className="font-semibold text-on-surface">Your Cart</h2>
                            <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-on-surface-variant">Your cart is empty</p>
                                </div>
                            ) : (
                                cartItems.map((ci) => (
                                    <div key={ci.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                        {ci.snapshotImage && (
                                            <img src={ci.snapshotImage} alt={ci.snapshotName} className="w-16 h-16 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-on-surface truncate">{ci.snapshotName}</h4>
                                            <p className="text-sm font-bold text-primary">{formatNaira(ci.snapshotPrice)}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={() => handleUpdateQuantity(ci.id, ci.quantity, -1)}
                                                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="font-semibold text-sm w-5 text-center">{ci.quantity}</span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(ci.id, ci.quantity, 1)}
                                                    className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeCartItem.mutate(ci.id)}
                                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Cart Footer */}
                        {cartItems.length > 0 && (
                            <div className="border-t border-outline-variant px-5 py-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-on-surface-variant">Subtotal</span>
                                    <span className="font-bold text-on-surface">{formatNaira(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={checkoutCart.isPending}
                                    className="w-full h-12 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-95 disabled:opacity-50"
                                >
                                    {checkoutCart.isPending ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Submit Order'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Auth Modal */}
            <OnboardingAuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />

            <PublicBottomNav />
        </div>
    );
}
