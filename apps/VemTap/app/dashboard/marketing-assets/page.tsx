"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Archive, Download, QrCode, Plus, BarChart2, Settings, 
  FileText, Palette, Layout, Smartphone, CreditCard, 
  Layers, StickyNote, Image as ImageIcon, Map, Monitor, 
  ChevronRight, ArrowRight, Sparkles
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
  { id: 'social_media', label: 'Social Media', desc: 'Instagram, FB, WhatsApp posts.', icon: Smartphone, color: 'bg-rose-50 text-rose-600' },
];

export default function MarketingAssetsOverviewPage() {
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: business } = useMyBusiness();

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };

  return (
    <div className="pb-24 md:pb-10 space-y-8 max-w-4xl mx-auto p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Marketing Assets</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Create professional QR marketing materials for your business.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing-assets/library">
            <Button variant="outline" className="rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest">
              <Archive className="mr-2 size-4" />
              Library
            </Button>
          </Link>
          <Link href="/dashboard/marketing-assets/create">
            <Button className="rounded-2xl bg-[#066CF4] text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
              <Plus className="mr-2 size-4" />
              Create New
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Assets Created', value: assets?.length || 0, icon: Layout, color: 'text-[#066CF4]' },
          { label: 'Total Downloads', value: totals.downloads || 0, icon: Download, color: 'text-emerald-500' },
          { label: 'QR Scans', value: totals.scans || 0, icon: QrCode, color: 'text-amber-500' },
          { label: 'Active Goals', value: 3, icon: Sparkles, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="rounded-[32px] bg-white p-5 shadow-sm border border-gray-100">
            <div className={cn("size-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3", stat.color.replace('text-', 'bg-').replace('500', '50'))}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
          Asset Categories
          <span className="h-0.5 flex-1 bg-gray-100" />
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetCategories.map((cat) => (
            <motion.div 
              key={cat.id}
              whileHover={{ y: -5 }}
              className="group relative rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all hover:border-[#066CF4]/20 hover:shadow-xl hover:shadow-black/5"
            >
              <div className={cn("size-14 rounded-[22px] flex items-center justify-center mb-6 shadow-sm", cat.color)}>
                <cat.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{cat.label}</h3>
              <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed">
                {cat.desc}
              </p>
              
              <Link href={`/dashboard/marketing-assets/create?type=${cat.id}`} className="mt-8 block">
                <Button className="w-full h-12 rounded-2xl bg-gray-900 text-[10px] font-black uppercase tracking-widest group-hover:bg-[#066CF4] transition-all">
                  Create {cat.label.slice(0, -1)}
                  <ChevronRight size={16} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main CTA Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#066CF4] to-[#4293FF] p-10 text-white shadow-2xl shadow-blue-500/20"
      >
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
          <Badge className="bg-white/20 text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
            New Templates Available
          </Badge>
          <h2 className="text-4xl font-black leading-tight mb-4">
            Transform Your Physical Space Into A Growth Engine
          </h2>
          <p className="text-lg font-medium text-white/80 mb-10">
            Generate professional posters, table tents, and social media assets in seconds.
          </p>
          <Link href="/dashboard/marketing-assets/create">
            <Button className="h-16 px-12 rounded-3xl bg-white text-gray-900 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/10 hover:bg-gray-50 active:scale-95 transition-all">
              Create New Marketing Asset
              <ArrowRight className="ml-3 size-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
