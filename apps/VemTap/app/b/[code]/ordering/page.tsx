"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, QrCode, ArrowRight, ArrowLeft, 
    Smartphone, CheckCircle2, ChevronRight, 
    ShoppingBag, Search, X, User, Database, 
    Utensils, LayoutGrid, Calendar, Clock,
    CreditCard, MessageSquare, Star, Trash2,
    Sparkles
} from 'lucide-react';
import { useCatalogueStore } from '@/store/useCatalogueStore';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useCatalogueItems } from '@/services/catalogue/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const mockCategories = ['All', 'Starters', 'Main Meals', 'Drinks', 'Desserts'];

export default function CustomerOrderingPage() {
    const { cart, addToCart, removeFromCart, clearCart } = useCatalogueStore();
    const { data: business } = useMyBusiness();
    const { data: items = [] } = useCatalogueItems();
    
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchBar] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory === 'All' || String(item.category) === selectedCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handlePlaceOrder = () => {
        setIsSubmitted(true);
        setTimeout(() => {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }, 300);
    };

    if (isSubmitted) {
        return <OrderSuccessScreen onBack={() => { setIsSubmitted(false); clearCart(); }} />;
    }

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* CUSTOMER HEADER */}
            <div className="relative h-48 md:h-64 overflow-hidden">
                <div className="absolute inset-0 bg-[#066CF4] opacity-90" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 pt-12">
                   <div className="size-20 rounded-[28px] bg-white p-1 mb-4 shadow-2xl">
                      <div className="size-full rounded-[24px] bg-gray-50 overflow-hidden flex items-center justify-center">
                         {business?.logoUrl ? <img src={business.logoUrl} className="size-full object-cover" /> : <ShoppingBag className="text-[#066CF4]" />}
                      </div>
                   </div>
                   <h1 className="text-2xl font-black">{business?.name || 'Vemtap Business'}</h1>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">{business?.category || 'Digital Menu'}</p>
                </div>
            </div>

            <main className="px-6 -mt-10 relative z-10">
                {/* SEARCH & FILTERS */}
                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search our selection..."
                            value={searchQuery}
                            onChange={(e) => setSearchBar(e.target.value)}
                            className="w-full h-16 pl-16 pr-6 rounded-[28px] bg-white border border-gray-100 shadow-xl focus:ring-4 focus:ring-blue-50 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {mockCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedCategory === cat ? "bg-[#066CF4] text-white shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* PRODUCT GRID */}
                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.length > 0 ? filteredItems.map((item) => (
                        <div key={item.id} className="group flex gap-4 p-4 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                            <div className="size-24 rounded-[22px] bg-gray-50 overflow-hidden flex items-center justify-center shrink-0 border border-gray-50">
                                {item.mainImage ? <img src={item.mainImage} className="size-full object-cover" /> : <ShoppingBag className="text-gray-200" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                   <div className="flex justify-between items-start mb-1">
                                      <h4 className="text-base font-black text-gray-900 leading-tight">{item.name}</h4>
                                      <span className="text-sm font-black text-[#066CF4]">₦{Number(item.price).toLocaleString()}</span>
                                   </div>
                                   <p className="text-[10px] font-medium text-gray-400 leading-relaxed line-clamp-2">{item.description || 'Our signature offering prepared with high-quality ingredients.'}</p>
                                </div>
                                <Button 
                                    onClick={() => addToCart({ id: item.id, name: item.name, price: Number(item.price), quantity: 1, type: 'product' })}
                                    className="h-10 w-fit px-6 rounded-xl bg-gray-900 text-[10px] font-black uppercase tracking-widest hover:bg-[#066CF4] transition-all"
                                >
                                   Add to Cart
                                </Button>
                            </div>
                        </div>
                    )) : (
                       // Mock items if none found
                       [1, 2, 3, 4].map(i => (
                          <div key={i} className="flex gap-4 p-4 rounded-[32px] bg-white border border-gray-100 shadow-sm opacity-60">
                             <div className="size-24 rounded-[22px] bg-gray-50 flex items-center justify-center shrink-0">
                                <ShoppingBag className="text-gray-200" />
                             </div>
                             <div className="flex-1 space-y-3 py-2">
                                <div className="h-4 w-3/4 bg-gray-50 rounded-full" />
                                <div className="h-2 w-full bg-gray-50 rounded-full" />
                                <div className="h-8 w-24 bg-gray-50 rounded-xl" />
                             </div>
                          </div>
                       ))
                    )}
                </div>
            </main>

            {/* FLOATING CART SECTION */}
            {cart.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-sm">
                    <Button 
                        onClick={() => setIsCartOpen(true)}
                        className="w-full h-16 rounded-[28px] bg-[#066CF4] text-white shadow-2xl shadow-blue-500/40 flex items-center justify-between px-8 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <div className="flex items-center gap-3">
                           <div className="size-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                              {cart.length}
                           </div>
                           <span className="text-xs font-black uppercase tracking-[0.2em]">View Cart</span>
                        </div>
                        <span className="text-sm font-black">₦{cartTotal.toLocaleString()}</span>
                    </Button>
                </div>
            )}

            {/* CART MODAL/OVERLAY */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => setIsCartOpen(false)}
                    >
                        <motion.div 
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-full max-w-2xl bg-white rounded-t-[48px] p-8 md:p-12 overflow-y-auto max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-3xl font-black text-gray-900">Your Order</h3>
                                <button onClick={() => setIsCartOpen(false)} className="size-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"><X /></button>
                            </div>

                            <div className="space-y-6 mb-12">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="size-16 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0">
                                            <ShoppingBag className="text-gray-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-gray-900">{item.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <span className="text-sm font-black text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</span>
                                           <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                   <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Customer Information</h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <input placeholder="Full Name" className="h-14 px-6 rounded-2xl bg-gray-50 border-none font-bold text-sm w-full" />
                                      <input placeholder="Phone Number" className="h-14 px-6 rounded-2xl bg-gray-50 border-none font-bold text-sm w-full" />
                                   </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100">
                                   <div className="flex justify-between items-center mb-8">
                                      <span className="text-lg font-bold text-gray-400 uppercase tracking-widest">Total Amount</span>
                                      <span className="text-3xl font-black text-gray-900">₦{cartTotal.toLocaleString()}</span>
                                   </div>
                                   <Button 
                                       onClick={handlePlaceOrder}
                                       className="w-full h-16 rounded-[28px] bg-[#066CF4] text-white text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/20"
                                   >
                                      Place Request Now
                                   </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function OrderSuccessScreen({ onBack }: { onBack: () => void }) {
    return (
        <div className="fixed inset-0 bg-white z-[110] flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
                <div className="relative mx-auto mb-10 size-32 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                    <CheckCircle2 size={64} />
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -right-4 -top-4 text-emerald-400">
                        <Sparkles size={32} />
                    </motion.div>
                </div>

                <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">Request Submitted Successfully 🎉</h1>
                <p className="text-lg font-medium text-gray-500 mb-12">Your order has been sent to the business. You'll receive updates shortly.</p>
                
                <div className="p-8 rounded-[40px] bg-gray-50 border border-gray-100 mb-12">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Order Reference</p>
                   <p className="text-3xl font-black text-gray-900 uppercase">VMP-88241</p>
                </div>

                <div className="space-y-4">
                   <Button onClick={onBack} className="w-full h-16 rounded-2xl bg-gray-900 text-white font-black uppercase tracking-widest text-xs">Browse Menu Again</Button>
                   <Button variant="ghost" onClick={() => window.close()} className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Close Page</Button>
                </div>
            </motion.div>
        </div>
    );
}
