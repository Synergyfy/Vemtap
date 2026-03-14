'use client';

import React, { useState } from 'react';
import { 
    Search, 
    MessageCircle, 
    Star, 
    MapPin, 
    ChevronRight,
    Filter,
    ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const businesses = [
    { 
        id: '1', 
        name: 'VemTap Café', 
        category: 'Food & Drink', 
        rating: 4.8, 
        reviews: 124, 
        location: 'Downtown, Miami', 
        logo: null,
        description: 'Premium coffee and pastries in a modern atmosphere.'
    },
    { 
        id: '2', 
        name: 'Lumina Tech', 
        category: 'Electronics', 
        rating: 4.9, 
        reviews: 89, 
        location: 'Silicon Valley Area', 
        logo: null,
        description: 'Next-generation tech solutions and gadgets.'
    },
    { 
        id: '3', 
        name: 'Green Leaf Spa', 
        category: 'Wellness', 
        rating: 4.7, 
        reviews: 210, 
        location: 'Beachside, FL', 
        logo: null,
        description: 'Holistic wellness and relaxation therapies.'
    },
];

export default function BusinessDiscoveryPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBusinesses = businesses.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Discover</h1>
                    <p className="text-slate-500 font-medium">Find and message local businesses on VemTap.</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for businesses, categories, or services..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-vemtap/20 transition-all text-sm font-medium"
                    />
                </div>
                <button className="flex items-center gap-2 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0">
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((biz) => (
                    <div 
                        key={biz.id} 
                        className="bg-white rounded-4xl border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-vemtap/5 transition-all group overflow-hidden flex flex-col"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-vemtap/5 flex items-center justify-center text-vemtap text-xl font-black border border-vemtap/10">
                                    {biz.name.charAt(0)}
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                    <Star size={14} className="fill-amber-400 text-amber-400" />
                                    <span className="text-xs font-black text-amber-700">{biz.rating}</span>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-display font-black text-slate-900 mb-1">{biz.name}</h3>
                            <p className="text-[10px] font-black text-vemtap uppercase tracking-widest mb-3">{biz.category}</p>
                            
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                                {biz.description}
                            </p>
                            
                            <div className="flex items-center gap-2 text-slate-400 mb-6">
                                <MapPin size={14} />
                                <span className="text-xs font-bold">{biz.location}</span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50/50 border-t border-slate-50">
                            <button 
                                onClick={() => router.push(`/support-chat/${biz.id}`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 group-hover:bg-vemtap group-hover:text-white group-hover:border-vemtap transition-all shadow-sm"
                            >
                                <MessageCircle size={18} />
                                Chat Now
                                <ChevronRight size={16} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredBusinesses.length === 0 && (
                <div className="text-center py-20 space-y-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Search size={32} className="text-slate-200" />
                    </div>
                    <div>
                        <h3 className="text-lg font-display font-black text-slate-900">No businesses found</h3>
                        <p className="text-slate-500 text-sm">Try searching with a different term or category.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
