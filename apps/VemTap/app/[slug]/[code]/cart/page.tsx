'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    Loader2,
    ShoppingBag,
} from 'lucide-react';
import { useCustomerFlowStore } from '@/store/useCustomerFlowStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGuestCartStore } from '@/store/useGuestCartStore';
import { useShallow } from 'zustand/react/shallow';
import {
    useCart,
    useUpdateCartItem,
    useRemoveCartItem,
    useCheckoutCart,
} from '@/services/catalogue-cart/hooks';
import { useCartMergeOnLogin } from '@/hooks/useCartMergeOnLogin';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { PremiumBottomNav } from '@/components/visitor/PremiumBottomNav';
import { StepForm, StepFormData } from '@/components/visitor/StepForm';
import { api } from '@/lib/api';

export default function CartPage() {
    const params = useParams();
    const router = useRouter();
    const { branchId, storeName, logoUrl, setUserData } = useCustomerFlowStore();
    const { isAuthenticated, user, login } = useAuthStore();
    
    // Guest cart selectors (optimised)
    const guestItems = useGuestCartStore(
        useShallow((s) => (branchId ? s.getItemsForBranch(branchId) : []))
    );
    const guestSummary = useGuestCartStore(
        useShallow((s) =>
            branchId ? s.getSummaryForBranch(branchId) : { itemCount: 0, total: 0 }
        )
    );
    
    const addItem = useGuestCartStore((s) => s.addItem);
    const updateQuantity = useGuestCartStore((s) => s.updateQuantity);
    const removeItem = useGuestCartStore((s) => s.removeItem);

    useCartMergeOnLogin(branchId);

    const [notes, setNotes] = useState('');
    const [tableNumber, setTableNumber] = useState('');
    const [showAuthForm, setShowAuthForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Server cart hooks (authenticated)
    const { data: serverCart, isLoading } = useCart(branchId);
    const updateItemMutation = useUpdateCartItem(branchId || '');
    const removeItemMutation = useRemoveCartItem(branchId || '');
    const checkoutMutation = useCheckoutCart(branchId || '');

    // Which cart to show
    const cartItems = isAuthenticated ? (serverCart?.items || []) : guestItems;
    const cartTotal = isAuthenticated ? (serverCart?.total || 0) : guestSummary.total;
    const cartItemCount = isAuthenticated ? (serverCart?.itemCount || 0) : guestSummary.itemCount;

    const handleUpdateQty = (id: string, currentQty: number, delta: number) => {
        const newQty = currentQty + delta;
        if (isAuthenticated) {
            updateItemMutation.mutate({ cartItemId: id, quantity: newQty });
        } else {
            updateQuantity(id, newQty);
        }
    };

    const handleRemove = (id: string) => {
        if (isAuthenticated) {
            removeItemMutation.mutate(id, {
                onSuccess: () => toast.success('Item removed'),
            });
        } else {
            removeItem(id);
            toast.success('Item removed');
        }
    };

    const handleCheckout = async () => {
        if (!isAuthenticated) {
            setShowAuthForm(true);
            return;
        }
        try {
            await checkoutMutation.mutateAsync({
                branchId: branchId!,
                notes: notes || undefined,
                tableNumber: tableNumber || undefined,
                deviceId: useCustomerFlowStore.getState().deviceId || undefined,
            });
            toast.success('Order placed successfully! 🎉');
            router.push(`/${params.slug}/${params.code}/success`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Checkout failed';
            toast.error(msg);
        }
    };

    const onAuthComplete = async (data: StepFormData) => {
        setIsSubmitting(true);
        try {
            const nameParts = data.name?.trim().split(/\s+/) || ['Visitor'];
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || ' ';
            await api.post('/visitors/signup', { firstName, lastName, email: data.email, phone: data.phone || undefined });
            const authResponse = await api.post('/auth/login', { identifier: data.email, password: '123456' });
            if (authResponse?.access_token) {
                login(authResponse.user, authResponse.access_token);
                setUserData(data);
                setShowAuthForm(false);
                // Merge hook will fire automatically via useCartMergeOnLogin
                // Then user can checkout
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Authentication failed';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && isAuthenticated) {
        return (
            <div className="min-h-screen bg-surface flex items-center justify-center">
                <Loader2 className="size-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface font-body text-on-surface pb-40">
            {/* Header */}
            <header className="fixed top-0 left-0 w-full flex items-center px-4 py-3 bg-surface/80 backdrop-blur-xl z-50 border-b border-slate-100">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-3"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <span className="text-base font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-headline tracking-tight">
                        {storeName}
                    </span>
                    <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Your Cart</p>
                </div>
                {cartItemCount > 0 && (
                    <span className="text-[10px] font-black text-outline uppercase tracking-widest">
                        {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
                    </span>
                )}
            </header>

            <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
                {/* Empty State */}
                {cartItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
                        <div className="size-24 bg-primary/5 rounded-3xl flex items-center justify-center">
                            <ShoppingCart size={48} className="text-primary/30" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-headline font-black text-on-surface">Your cart is empty</h2>
                            <p className="text-sm text-outline font-medium">Add products, services, or offers to get started</p>
                        </div>
                        <button
                            onClick={() => router.push(`/${params.slug}/${params.code}/products`)}
                            className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <ShoppingBag size={16} />
                            Browse Products
                        </button>
                    </div>
                )}

                {/* Cart Items */}
                {cartItems.length > 0 && (
                    <>
                        <AnimatePresence>
                            {cartItems.map((item) => {
                                // Normalise between server CartItem and GuestCartItem
                                const id = item.id;
                                const isServerItem = 'cartId' in item;
                                const name = isServerItem ? item.snapshotName : item.name;
                                const price = isServerItem ? Number(item.snapshotPrice) : item.price;
                                const image = isServerItem ? item.snapshotImage : item.image;
                                const quantity = item.quantity;

                                return (
                                    <motion.div
                                        key={id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex gap-4"
                                    >
                                        {/* Image */}
                                        <div className="size-16 rounded-xl bg-primary/5 shrink-0 overflow-hidden">
                                            {image ? (
                                                <img src={image} alt={name} className="size-full object-cover" />
                                            ) : (
                                                <div className="size-full flex items-center justify-center">
                                                    <ShoppingBag size={24} className="text-primary/30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-headline font-bold text-sm text-on-surface line-clamp-1">{name}</p>
                                            <p className="text-primary font-black text-sm mt-0.5">{formatPrice(price)}</p>

                                            {/* Qty + Remove */}
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                                                    <button
                                                        onClick={() => handleUpdateQty(id, quantity, -1)}
                                                        className="size-7 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                        disabled={removeItemMutation.isPending || updateItemMutation.isPending}
                                                    >
                                                        <Minus size={12} strokeWidth={3} />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-black">{quantity}</span>
                                                    <button
                                                        onClick={() => handleUpdateQty(id, quantity, 1)}
                                                        className="size-7 bg-white rounded-lg flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                                                        disabled={updateItemMutation.isPending}
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-on-surface">
                                                        {formatPrice(price * quantity)}
                                                    </p>
                                                    <button
                                                        onClick={() => handleRemove(id)}
                                                        className="size-7 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
                                                        disabled={removeItemMutation.isPending}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Order Notes */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-outline">Order Details (Optional)</h4>
                            <textarea
                                placeholder="Add a note (e.g. no onions, extra sauce...)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                            />
                            <input
                                type="text"
                                placeholder="Table number (optional)"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline/60"
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-outline font-medium">Items</span>
                                <span className="font-bold">{cartItemCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-black text-on-surface">Total</span>
                                <span className="font-black text-primary text-xl">{formatPrice(cartTotal)}</span>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Sticky Checkout CTA */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 px-4 z-40 max-w-2xl mx-auto">
                    <button
                        onClick={handleCheckout}
                        disabled={checkoutMutation.isPending}
                        className={cn(
                            "w-full h-14 bg-slate-900 text-white font-black rounded-2xl shadow-2xl shadow-slate-900/20",
                            "hover:bg-black hover:-translate-y-0.5 active:scale-[0.98] transition-all",
                            "flex items-center justify-center gap-3 uppercase tracking-widest text-sm",
                            "disabled:opacity-70"
                        )}
                    >
                        {checkoutMutation.isPending ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <ShoppingBag size={20} />
                                Place Order · {formatPrice(cartTotal)}
                            </>
                        )}
                    </button>
                </div>
            )}

            <PremiumBottomNav />

            {/* Auth Modal */}
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
                                customWelcomeMessage="Sign in to place your order. Your cart items will be saved."
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
