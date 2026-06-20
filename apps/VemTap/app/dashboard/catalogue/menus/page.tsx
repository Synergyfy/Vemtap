"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    LayoutTemplate, Smartphone, QrCode, Palette, 
    Layers, ArrowLeft, Plus, Settings, ChevronRight,
    GripVertical, Edit2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ConfigureMenuPage() {
    const [categories, setCategories] = useState([
        { id: 1, name: 'Starters', items: 3 },
        { id: 2, name: 'Main Course', items: 8 },
        { id: 3, name: 'Desserts', items: 4 },
        { id: 4, name: 'Beverages', items: 6 },
    ]);

    return (
        <div className="min-h-screen bg-gray-50/30 pb-24 md:pb-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/catalogue">
                        <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-white border border-gray-100 hover:bg-gray-50 shadow-sm transition-all hover:-translate-x-1">
                            <ArrowLeft size={20} className="text-gray-400" />
                        </Button>
                    </Link>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Catalogue Manager</p>
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Digital Menu Builder</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 flex items-center gap-2">
                        <QrCode size={16} />
                        Get QR Code
                    </Button>
                    <Button className="h-12 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all">
                        Publish Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Menu Builder */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Theme & Style */}
                    <div className="rounded-[32px] bg-white p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                <Palette size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Menu Theme</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Currently using: Dark Elegance</p>
                            </div>
                        </div>
                        <Button variant="outline" className="rounded-xl border-gray-200 font-bold text-xs uppercase tracking-widest">
                            Change Theme
                        </Button>
                    </div>

                    {/* Category Builder */}
                    <div className="rounded-[32px] bg-white shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">Menu Layout</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Organize your categories</p>
                                </div>
                            </div>
                            <Button className="rounded-xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest h-10 px-6">
                                Add Category
                            </Button>
                        </div>

                        <div className="p-4 bg-gray-50/50 space-y-3">
                            {categories.map((cat, i) => (
                                <motion.div 
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#066CF4] transition-all cursor-move"
                                >
                                    <div className="flex items-center gap-4">
                                        <GripVertical size={20} className="text-gray-300 group-hover:text-gray-500" />
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900">{cat.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{cat.items} Items Linked</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-gray-500 hover:text-[#066CF4] hover:bg-blue-50">
                                            <Edit2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50">
                                            <Trash2 size={14} />
                                        </Button>
                                        <div className="w-px h-6 bg-gray-200 mx-1" />
                                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-gray-400 hover:text-gray-900">
                                            <ChevronRight size={18} />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Mobile Preview */}
                <div className="lg:col-span-4 flex justify-center">
                    <div className="sticky top-8">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</h3>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#066CF4] bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                <Smartphone size={12} />
                                Mobile View
                            </span>
                        </div>

                        {/* Device Frame */}
                        <div className="w-[300px] h-[600px] rounded-[40px] bg-gray-900 p-2 shadow-2xl relative overflow-hidden border-4 border-gray-800">
                            {/* Notch */}
                            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                                <div className="w-32 h-6 bg-gray-900 rounded-b-2xl" />
                            </div>
                            
                            {/* Screen Content */}
                            <div className="bg-[#111111] size-full rounded-[32px] overflow-hidden flex flex-col relative pt-8">
                                <div className="p-6 text-center space-y-2 border-b border-white/10 shrink-0">
                                    <div className="size-16 rounded-full bg-white/5 mx-auto mb-4 flex items-center justify-center">
                                        <LayoutTemplate size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white">VemTap Cafe</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Digital Menu</p>
                                </div>
                                
                                <div className="p-4 space-y-4 overflow-y-auto no-scrollbar pb-20">
                                    {categories.map((cat) => (
                                        <div key={cat.id} className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                            <h4 className="text-sm font-black text-white mb-4">{cat.name}</h4>
                                            <div className="space-y-3">
                                                {[1,2].map(item => (
                                                    <div key={item} className="flex gap-3">
                                                        <div className="size-12 rounded-xl bg-white/10 shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="h-3 w-3/4 bg-white/20 rounded mb-2" />
                                                            <div className="h-2 w-1/2 bg-white/10 rounded" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Floating View Cart */}
                                <div className="absolute bottom-4 inset-x-4">
                                    <div className="h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">View Cart (2 items)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
