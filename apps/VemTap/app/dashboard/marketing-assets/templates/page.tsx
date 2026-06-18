"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMarketingTemplates } from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { 
    QrCode, Search, Filter, Layers, ArrowRight, 
    ChevronLeft, Image as ImageIcon, Monitor, 
    StickyNote, Map, Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const assetTypes = [
    { id: 'all', label: 'All Assets', icon: Layers },
    { id: 'posters', label: 'Posters', icon: ImageIcon },
    { id: 'counter_displays', label: 'Counter Displays', icon: Monitor },
    { id: 'table_tents', label: 'Table Tents', icon: Layers },
    { id: 'flyers', label: 'Flyers', icon: StickyNote },
    { id: 'banners', label: 'Roll-Up Banners', icon: Map },
];

export default function TemplateLibraryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const typeParam = searchParams.get('type') || 'all';
    
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string>(typeParam);

    useEffect(() => {
        setSelectedType(typeParam);
    }, [typeParam]);

    const { data: templates, isLoading } = useMarketingTemplates(
        undefined,
        selectedType === 'all' ? undefined : selectedType
    );

    const { data: business } = useMyBusiness();

    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        return templates.filter((t) => {
            const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
            return matchesSearch;
        });
    }, [templates, search]);

    return (
        <div className="min-h-screen bg-gray-50 pb-32 px-6 pt-12 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => router.push('/dashboard/marketing-assets')}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#066CF4] transition-colors"
                    >
                        <ChevronLeft size={14} />
                        Back to Marketing Hub
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 leading-tight capitalize">
                        {selectedType.replace('_', ' ')} Templates
                    </h1>
                    <p className="text-sm font-medium text-gray-500 max-w-md leading-relaxed">
                        Select a professionally designed template for your business. Your QR code is automatically embedded.
                    </p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-14 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#066CF4]/10 outline-none font-bold text-sm shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {assetTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => {
                            setSelectedType(type.id);
                            router.push(`/dashboard/marketing-assets/templates?type=${type.id}`);
                        }}
                        className={cn(
                            "flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border",
                            selectedType === type.id 
                                ? "bg-gray-900 text-white border-gray-900 shadow-xl shadow-black/10" 
                                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                        )}
                    >
                        <type.icon size={16} />
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-[3/4] bg-white border border-gray-100 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-gray-100 space-y-6">
                    <div className="size-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mx-auto">
                        <Layers size={40} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-black text-xl text-gray-900">No templates found</h4>
                        <p className="text-sm font-medium text-gray-400">Try adjusting your search or category.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredTemplates.map((template, idx) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-black/5 hover:border-[#066CF4]/20 transition-all flex flex-col"
                        >
                            <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden flex items-center justify-center border-b border-gray-50">
                                {template.thumbnailUrl ? (
                                    <img
                                        src={template.thumbnailUrl}
                                        alt={template.name}
                                        className="size-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-gray-300">
                                        <QrCode size={64} className="opacity-20" />
                                        <Sparkles size={32} className="opacity-10" />
                                    </div>
                                )}
                                
                                <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 backdrop-blur text-[9px] font-black text-gray-900 rounded-full border border-white uppercase tracking-widest shadow-sm">
                                    {template.category}
                                </div>
                            </div>

                            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <h4 className="font-black text-gray-900 text-lg group-hover:text-[#066CF4] transition-colors leading-tight">
                                        {template.name}
                                    </h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-relaxed">
                                        {template.description || 'Professional marketing material with your business QR.'}
                                    </p>
                                </div>

                                <Link href={`/dashboard/marketing-assets/create?templateId=${template.id}`}>
                                    <Button className="w-full h-14 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl group-hover:bg-[#066CF4] transition-all shadow-xl shadow-black/5">
                                        Select Template
                                        <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
