'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCatalogueItem, useCatalogueOfferDetails } from '@/services/catalogue/hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, 
    Zap, 
    ShieldCheck, 
    Gift,
    CreditCard,
    ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';

export default function SingleCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const branchId = searchParams.get('branchId');
    const itemId = searchParams.get('buyNow');
    const [isProcessing, setIsProcessing] = useState(false);

    const { data: item, isLoading: itemLoading } = useCatalogueItem(itemId || '', branchId || undefined);
    // Note: If it's an offer, we'd need another hook or check, but let's focus on items for now 
    // or handle offer if the ID looks like one. For simplicity, we'll check item first.

    if (!branchId || !itemId) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-xl font-bold text-slate-900">Invalid Checkout</h1>
                <p className="text-slate-500 mt-2">Missing branch or item information.</p>
                <button onClick={() => router.back()} className="mt-6 text-primary font-bold">Go Back</button>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        if (!item) return;
        setIsProcessing(true);
        try {
            const payload = {
                firstName: user?.firstName || 'Guest',
                lastName: user?.lastName || '',
                phone: user?.phone || '',
                email: user?.email || '',
                branchId,
                items: [{
                    itemId: item.id,
                    quantity: 1
                }]
            };

            await api.post('/catalogue/orders', payload);
            toast.success('Order placed successfully!');
            router.push('/customer/orders');
        } catch (error: any) {
            toast.error(error.message || 'Failed to place order');
        } finally {
            setIsProcessing(false);
        }
    };

    if (itemLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Spinner /></div>;
    if (!item) return <div className="p-8 text-center">Item not found</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-32">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-xl">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-black text-slate-900">Instant Checkout</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6 mt-4">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
                    <div className="flex gap-4 mb-6">
                        <div className="size-24 rounded-2xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                            {item.mainImage ? (
                                <img src={item.mainImage} alt="" className="size-full object-cover" />
                            ) : (
                                <div className="size-full flex items-center justify-center text-slate-300">
                                    <ShoppingBag size={32} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-slate-900 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.shortDescription}</p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xl font-black text-primary">₦{item.price.toLocaleString()}</span>
                                {item.loyaltyPoints && (
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                        +{item.loyaltyPoints} Points
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-bold">Subtotal</span>
                            <span className="text-slate-900 font-black">₦{item.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-bold">Delivery</span>
                            <span className="text-emerald-500 font-black tracking-widest uppercase text-[10px]">Free</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                            <span className="text-lg font-black text-slate-900">Total</span>
                            <span className="text-lg font-black text-primary">₦{item.price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200">
                        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Secure Checkout</p>
                            <p className="text-xs text-slate-500">Your order is protected by EntryConect security protocols.</p>
                        </div>
                    </div>
                </div>
            </main>

            <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 pb-safe shadow-2xl z-40">
                <div className="max-w-md mx-auto">
                    <button 
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full h-14 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-transform"
                    >
                        {isProcessing ? <Spinner size="sm" color="white" /> : (
                            <>
                                <Zap size={18} fill="currentColor" />
                                Complete Order Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
