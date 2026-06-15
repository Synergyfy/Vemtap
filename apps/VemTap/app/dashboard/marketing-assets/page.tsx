"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Archive, Download, QrCode, Plus, BarChart2, Settings, 
  FileText, Palette, Layout, Smartphone, CreditCard, 
  Layers, StickyNote, Image as ImageIcon, Map, Monitor, 
  ChevronRight, ArrowRight, Sparkles, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import {
  useMarketingAssets,
  useAnalyticsOverview,
  useBrandProfile,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const assetCategories = [
  { id: 'posters', label: 'Posters', desc: 'A4, A3, A2 high-resolution prints.', icon: ImageIcon, color: 'bg-blue-50 text-blue-600' },
  { id: 'counter_displays', label: 'Counter Displays', desc: 'Perfect for checkout areas.', icon: Monitor, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'table_tents', label: 'Table Tents', desc: 'Dine-in QR experience.', icon: Layers, color: 'bg-amber-50 text-amber-600' },
  { id: 'flyers', label: 'Flyers', desc: 'Promotional handouts.', icon: StickyNote, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'stickers', label: 'Stickers', desc: 'Window and door decals.', icon: Map, color: 'bg-pink-50 text-pink-600' },
  { id: 'business_cards', label: 'Business Cards', desc: 'Personal QR connections.', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
];

export default function MarketingAssetsOverviewPage() {
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: business } = useMyBusiness();

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };

  if (assetsLoading || analyticsLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Growth Engine...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-6 md:p-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#066CF4]/10 border border-[#066CF4]/20 flex items-center justify-center text-[#066CF4]">
                <TrendingUp size={28} />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-2">Marketing Hub</p>
                <h1 className="text-2xl font-black text-gray-900 leading-none">Growth Tools</h1>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing-assets/library">
            <Button variant="ghost" className="h-14 px-8 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm">
              <Archive className="mr-2 size-4" />
              My Library
            </Button>
          </Link>
          <Link href="/dashboard/marketing-assets/create">
            <Button className="h-14 px-8 rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
              <Plus className="mr-2 size-4" />
              Create Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <section>
        <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Marketing Performance</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 snap-x">
            {[
              { label: 'Assets Created', value: assets?.length || 0, icon: Layout, color: 'bg-blue-50 text-[#066CF4]' },
              { label: 'Total Downloads', value: totals.downloads || 0, icon: Download, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'QR Scans', value: totals.scans || 0, icon: QrCode, color: 'bg-amber-50 text-amber-600' },
              { label: 'Active Goals', value: 3, icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="min-w-[240px] md:flex-1 rounded-[2.5rem] bg-white p-6 shadow-sm border border-gray-100 snap-center flex flex-col justify-between h-40 group hover:border-[#066CF4]/20 transition-all"
              >
                <div className={cn("size-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110", stat.color.split(' ')[0])}>
                  <stat.icon size={24} className={stat.color.split(' ')[1]} />
                </div>
                <div>
                    <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asset Categories</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetCategories.map((cat, i) => (
            <motion.div 
              key={cat.id}
              whileHover={{ y: -5 }}
              className="group relative rounded-[2.5rem] bg-white p-8 shadow-sm border border-gray-100 transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5 active:scale-[0.98]"
            >
              <div className={cn("size-16 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform", cat.color)}>
                <cat.icon size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">{cat.label}</h3>
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight mb-8">
                {cat.desc}
              </p>
              
              <Link href={`/dashboard/marketing-assets/create?type=${cat.id}`}>
                <Button className="w-full h-14 rounded-2xl bg-gray-900 text-[10px] font-black uppercase tracking-widest text-white group-hover:bg-[#066CF4] transition-all shadow-xl shadow-black/5">
                  Create {cat.label.slice(0, -1)}
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main CTA Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3rem] bg-gray-900 p-12 text-white shadow-2xl shadow-blue-500/10 border border-gray-800"
      >
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#066CF4]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-[#066CF4]/5 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
          <div className="bg-[#066CF4]/20 text-[#4293FF] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-[#066CF4]/30">
            Professional Design Engine
          </div>
          <h2 className="text-3xl md:text-4xl font-black leading-[1.1] mb-6">
            Transform Your Physical Space Into A <span className="text-[#066CF4]">Growth Engine</span>
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-10 leading-relaxed uppercase tracking-widest">
            Generate high-resolution posters, table tents, and social media assets for your business in seconds.
          </p>
          <Link href="/dashboard/marketing-assets/create">
            <Button className="h-16 px-12 rounded-[2rem] bg-[#066CF4] text-white text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 hover:bg-[#4293FF] active:scale-95 transition-all">
              Launch Creator Hub
              <ArrowRight className="ml-3 size-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
