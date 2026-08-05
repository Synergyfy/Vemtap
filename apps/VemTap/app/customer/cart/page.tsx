'use client';

import React, { useState, useMemo } from 'react';
import { useCartStore, BranchCart, CartItem } from '@/store/useCartStore';
import { 
    ShoppingBag, 
    Trash2, 
    Plus, 
    Minus, 
    ArrowRight, 
    Store, 
    ChevronRight,
    CreditCard,
    Gift,
    ShieldCheck,
    Truck,
    ArrowLeft,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';

export default function UnifiedCartPage() {
    const { carts, removeItem, updateQuantity, clearBranchCart, clearAllCarts } = useCartStore();
    const user = useAuthStore(s => s.user);
    const router = useRouter();
    const [isCheckingOut, setIsStartingCheckout] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const cartList = useMemo(() => Object.values(carts), [carts]);
    const isEmpty = cartList.length === 0;

    const totals = useMemo(() => {
        let items = 0;
        let amount = 0;
        let points = 0;
        cartList.forEach(cart => {
            cart.items.forEach(item => {
                items += item.quantity;
                amount += item.price * item.quantity;
                points += (item.loyaltyPoints || 0) * item.quantity;
            });
        });
        return { items, amount, points };
    }, [cartList]);

    // Use effect to handle potential 'buyNow' from other pages if they redirect here
    // but the specialized /customer/checkout is preferred for Zap/Instant Buy.

    const handleBulkCheckout = async () => {
        setIsStartingCheckout(true);
        try {
            const payload = {
                orders: cartList.map(cart => ({
                    branchId: cart.branchId,
                    items: cart.items.map(i => ({
                        itemId: i.type === 'item' ? i.id : undefined,
                        offerId: i.type === 'offer' ? i.id : undefined,
                        quantity: i.quantity
                    })),
                    notes: cart.notes,
                    tableNumber: cart.tableNumber
                }))
            };

            await api.post('/catalogue/orders/bulk-checkout', payload);
            toast.success('All orders placed successfully!');
            clearAllCarts();
            router.push('/customer/dashboard/orders');
        } catch (error: any) {
            toast.error(error.message || 'Bulk checkout failed');
        } finally {
            setIsStartingCheckout(false);
            setShowConfirmModal(false);
        }
    };

    if (isEmpty) {
        return (
            <div className="h-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                    <ShoppingBag className="w-12 h-12 text-slate-200" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h1>
                <p className="text-slate-500 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                <Link 
                    href="/customer/dashboard"
                    className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="font-black text-slate-900">Unified Cart</h1>
                    </div>
                    <button 
                        onClick={clearAllCarts}
                        className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Clear All
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-6 mt-4">
                {cartList.map((cart) => (
                    <div key={cart.branchId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Branch Header */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Store size={16} className="text-primary" />
                                <span className="text-sm font-black text-slate-900">Branch ID: {cart.branchId.slice(0, 8)}</span>
                            </div>
                            <button 
                                onClick={() => clearBranchCart(cart.branchId)}
                                className="text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="divide-y divide-slate-50">
                            {cart.items.map((item) => (
                                <div key={item.id} className="p-4 flex gap-4">
                                    <div className="size-20 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                        {item.image ? (
                                            <img src={item.image} alt="" className="size-full object-cover" />
                                        ) : (
                                            <div className="size-full flex items-center justify-center text-slate-300">
                                                <ShoppingBag size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>
                                            <span className="text-sm font-black text-primary">₦{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-tight">{item.type}</p>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                                                <button 
                                                    onClick={() => updateQuantity(cart.branchId, item.id, item.quantity - 1)}
                                                    className="size-8 rounded-lg flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-10 text-center text-xs font-black text-slate-900">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(cart.branchId, item.id, item.quantity + 1)}
                                                    className="size-8 rounded-lg flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {item.loyaltyPoints && item.loyaltyPoints > 0 && (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                                    <Gift size={10} />
                                                    +{item.loyaltyPoints * item.quantity} Points
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Branch Subtotal */}
                        <div className="p-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Subtotal</span>
                            <span className="text-sm font-black text-slate-900">
                                ₦{cart.items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShieldCheck size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Secure<br/>Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Truck size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Quick<br/>Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <Gift size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">Reward<br/>Points</span>
                    </div>
                </div>
            </main>

            {/* Footer Summary */}
            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 pb-safe shadow-2xl z-40">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-slate-900">₦{totals.amount.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-emerald-500">+{totals.points} pts</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowConfirmModal(true)}
                        className="h-14 px-8 bg-primary text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                    >
                        Checkout All
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Place Orders?</h2>
                            <p className="text-slate-500 mb-8">
                                You are about to place <span className="font-bold text-slate-900">{totals.items} items</span> across <span className="font-bold text-slate-900">{cartList.length} branches</span>. Are you sure?
                            </p>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={handleBulkCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full h-14 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isCheckingOut ? <Spinner size="sm" color="white" /> : (
                                        <>
                                            Yes, Checkout Now
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => setShowConfirmModal(false)}
                                    className="w-full h-14 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
