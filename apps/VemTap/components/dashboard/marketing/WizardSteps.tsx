'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    ImageIcon, Monitor, Layers, StickyNote, Map, 
    CreditCard, Smartphone, ChevronRight, ArrowRight,
    QrCode, Star, Users, Utensils, Calendar, MessageCircle,
    Bell, Check, Palette, Type, Layout, Image as ImageIcon2,
    Sparkles, ShieldCheck, Database, LineChart
} from 'lucide-react';
import { useMarketingAssetStore, AssetType, MarketingGoal } from '@/store/useMarketingAssetStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function StepAssetType() {
    const { setAssetType, setStep } = useMarketingAssetStore();

    const types: { id: AssetType, label: string, desc: string, icon: any, color: string }[] = [
        { id: 'poster', label: 'QR Poster', desc: 'A4, A3, A2 high-res wall prints.', icon: ImageIcon, color: 'bg-blue-50 text-blue-600' },
        { id: 'counter_display', label: 'Counter Display', desc: 'Durable prints for checkout points.', icon: Monitor, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'table_tent', label: 'Table Tent', desc: 'Foldable QR stands for tables.', icon: Layers, color: 'bg-amber-50 text-amber-600' },
        { id: 'flyer', label: 'Promotion Flyer', desc: 'A5, A4 handouts for customers.', icon: StickyNote, color: 'bg-indigo-50 text-indigo-600' },
        { id: 'sticker', label: 'QR Sticker', desc: 'Decals for windows and doors.', icon: Map, color: 'bg-pink-50 text-pink-600' },
        { id: 'social_media', label: 'Social Media', desc: 'Ready-to-post digital assets.', icon: Smartphone, color: 'bg-rose-50 text-rose-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Select Asset Type</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">Choose the format of marketing material you want to create.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {types.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setAssetType(type.id)}
                        className="group flex items-center gap-4 p-5 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98]"
                    >
                        <div className={cn("size-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", type.color)}>
                            <type.icon size={28} />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-base font-bold text-gray-900">{type.label}</h3>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{type.desc}</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                    </button>
                ))}
            </div>
        </div>
    );
}

export function StepMarketingGoal() {
    const { setGoal, setStep } = useMarketingAssetStore();

    const goals: { id: MarketingGoal, label: string, desc: string, icon: any, color: string }[] = [
        { id: 'capture_customers', label: 'Capture Customers', desc: 'Build your customer database fast.', icon: Users, color: 'bg-blue-50 text-blue-600' },
        { id: 'collect_reviews', label: 'Collect Reviews', desc: 'Get more 5-star ratings.', icon: Star, color: 'bg-amber-50 text-amber-600' },
        { id: 'promote_offers', label: 'Promote Offers', desc: 'Drive sales with limited deals.', icon: Sparkles, color: 'bg-rose-50 text-rose-600' },
        { id: 'grow_loyalty', label: 'Grow Loyalty', desc: 'Reward returning customers.', icon: Star, color: 'bg-emerald-50 text-emerald-600' },
        { id: 'take_orders', label: 'Take Orders', desc: 'Direct digital ordering flow.', icon: Utensils, color: 'bg-indigo-50 text-indigo-600' },
        { id: 'book_appointments', label: 'Book Appointments', desc: 'Fill your calendar effortlessly.', icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">Choose Marketing Goal</h2>
                <p className="mt-2 text-sm font-medium text-gray-500">What is the primary objective of this asset?</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {goals.map((goal) => (
                    <button
                        key={goal.id}
                        onClick={() => setGoal(goal.id)}
                        className="group flex items-center gap-4 p-5 rounded-[32px] bg-white border border-gray-100 shadow-sm transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98]"
                    >
                        <div className={cn("size-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", goal.color)}>
                            <goal.icon size={28} />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="text-base font-bold text-gray-900">{goal.label}</h3>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{goal.desc}</p>
                        </div>
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-[#066CF4] transition-all group-hover:translate-x-1" />
                    </button>
                ))}
            </div>
            
            <div className="mt-4 flex justify-center">
                <Button variant="ghost" onClick={() => setStep(2)} className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Back to Asset Type
                </Button>
            </div>
        </div>
    );
}

export function MarketingTemplateEngine({ asset }: { asset: any }) {
    // Simplified engine for previewing
    return (
        <div 
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-gray-100"
            style={{ backgroundColor: asset.branding.primaryColor }}
        >
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
            
            <div className="relative h-full p-8 flex flex-col items-center justify-between text-white text-center">
                {asset.branding.logo && (
                    <img src={asset.branding.logo} alt="Logo" className="w-16 h-16 object-contain" />
                )}
                
                <div className="space-y-4">
                    <h3 className="text-2xl font-black leading-tight uppercase tracking-tighter">
                        {asset.content.headline}
                    </h3>
                    <p className="text-sm font-bold opacity-80">
                        {asset.content.subheadline}
                    </p>
                </div>

                <div className="bg-white p-4 rounded-3xl shadow-xl">
                    <QrCode size={120} className="text-gray-900" />
                    <div className="mt-2 text-[10px] font-black text-gray-900 uppercase tracking-widest">
                        {asset.content.ctaText}
                    </div>
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest">{asset.content.businessName}</p>
                    <p className="text-[8px] font-bold opacity-60">{asset.content.website}</p>
                </div>
            </div>
        </div>
    );
}
