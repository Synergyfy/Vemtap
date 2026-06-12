'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Image as ImageIcon, Camera, 
    Check, X, ArrowRight, HelpCircle, 
    Tag, DollarSign, Info, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AddProductForm({ onSave }: { onSave: () => void }) {
    const [priceVisible, setPriceVisible] = useState(true);
    const [availability, setAvailability] = useState('available');

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Add New Product</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Define an item customers can order.</p>
            </div>

            {/* Image Upload */}
            <div className="rounded-[40px] border-2 border-dashed border-gray-200 p-10 text-center transition-all hover:border-[#066CF4]/30 hover:bg-blue-50/30 group">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-gray-50 text-gray-300 group-hover:bg-white group-hover:text-[#066CF4] group-hover:shadow-xl transition-all">
                    <Camera size={40} />
                </div>
                <div className="mt-6 space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-[#066CF4]">Upload Product Image</p>
                    <p className="text-[10px] font-bold text-gray-400">High resolution JPG or PNG preferred.</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Product Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Caramel Macchiato" 
                        className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Price (₦)</label>
                        <div className="relative">
                           <input 
                               type="number" 
                               placeholder="0.00" 
                               className="w-full h-16 bg-gray-50 border-none rounded-2xl pl-8 pr-16 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all"
                           />
                           <button 
                               onClick={() => setPriceVisible(!priceVisible)}
                               className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#066CF4] transition-colors"
                           >
                               {priceVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                           </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Category</label>
                        <select className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 text-sm font-bold text-gray-900 appearance-none">
                            <option>Select Category</option>
                            <option>Starters</option>
                            <option>Main Meals</option>
                            <option>Drinks</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Availability</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['available', 'out_of_stock', 'hidden'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setAvailability(status)}
                                className={cn(
                                    "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                    availability === status ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                )}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {['Popular', 'New', 'Featured', 'Best Seller'].map(tag => (
                            <button key={tag} className="px-4 py-2 rounded-xl bg-blue-50 text-[#066CF4] text-[9px] font-black uppercase tracking-widest hover:bg-[#066CF4] hover:text-white transition-all">
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={onSave} className="w-full h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                Save Product
            </Button>
        </div>
    );
}

export function AddServiceForm({ onSave }: { onSave: () => void }) {
    const [duration, setDuration] = useState('30 Minutes');

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Add New Service</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Define a service customers can book.</p>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Service Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Premium Haircut" 
                        className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#066CF4]/10 transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Duration</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['15 Min', '30 Min', '1 Hour', 'Custom'].map(dur => (
                            <button 
                                key={dur}
                                onClick={() => setDuration(dur)}
                                className={cn(
                                    "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                    duration === dur ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-400 border-transparent"
                                )}
                            >
                                {dur}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Price (₦)</label>
                        <input type="number" placeholder="0.00" className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 text-sm font-bold text-gray-900" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Category</label>
                        <select className="w-full h-16 bg-gray-50 border-none rounded-2xl px-8 text-sm font-bold text-gray-900 appearance-none">
                            <option>Haircuts</option>
                            <option>Styling</option>
                            <option>Coloring</option>
                        </select>
                    </div>
                </div>
            </div>

            <Button onClick={onSave} className="w-full h-16 rounded-2xl bg-[#066CF4] text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                Save Service
            </Button>
        </div>
    );
}
