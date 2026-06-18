"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, QrCode, Plus, Layout, Monitor, 
  ChevronRight, ArrowRight, TrendingUp,
  Image as ImageIcon, Layers, StickyNote, Map,
  FileText, Smartphone, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useMarketingAssets,
  useAnalyticsOverview,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { useActiveBranch } from '@/hooks/useActiveBranch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';

const assetCategories = [
  { id: 'posters', label: 'Posters', desc: 'A4, A3, A2 high-resolution prints.', icon: ImageIcon, color: 'bg-blue-50 text-[#066CF4]' },
  { id: 'counter_displays', label: 'Counter Displays', desc: 'Perfect for checkout areas.', icon: Monitor, color: 'bg-emerald-50 text-emerald-600' },
  { id: 'table_tents', label: 'Table Tents', desc: 'Dine-in QR experience.', icon: Layers, color: 'bg-amber-50 text-amber-600' },
  { id: 'flyers', label: 'Flyers', desc: 'Promotional handouts.', icon: StickyNote, color: 'bg-indigo-50 text-indigo-600' },
  { id: 'banners', label: 'Roll-Up Banners', desc: 'Large format event branding.', icon: Map, color: 'bg-purple-50 text-purple-600' },
];

export default function MarketingAssetsOverviewPage() {
  const router = useRouter();
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics } = useAnalyticsOverview();
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { activeBranchId } = useActiveBranch();
  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };
  const branchName = activeBranch?.name || business?.name || 'Vemtap';

  if (assetsLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="pb-32 space-y-10">
      {/* Top Section: Branding & Explanation */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
            {branchName} Marketing
        </h1>
        <p className="text-sm font-medium text-gray-500 max-w-lg mx-auto leading-relaxed">
            Marketing Assets are professionally designed materials that automatically include your <span className="text-[#066CF4] font-black uppercase tracking-widest bg-[#066CF4]/5 px-2 py-1 rounded-md">Business QR</span>. Customers can scan them to interact with your business.
        </p>
      </section>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Created', value: assets?.filter((a: any) => !a.isMock).length || 0, icon: Layout, color: 'bg-blue-50 text-[#066CF4]' },
          { label: 'Downloads', value: totals.downloads || 0, icon: Download, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'QR Scans', value: totals.scans || 0, icon: QrCode, color: 'bg-amber-50 text-amber-600' },
          { label: 'Conversion', value: `${totals.conversionRate || 0}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map((stat, i) => (
          <div 
            key={i} 
            className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2"
          >
            <div className={cn("size-10 rounded-xl flex items-center justify-center", stat.color)}>
              <stat.icon size={18} />
            </div>
            <div>
                <div className="text-xl font-black text-gray-900">{stat.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Asset Category Chooser Button */}
      <section className="flex flex-col items-center gap-8 pt-6">
        <Button 
            onClick={() => setIsTypeModalOpen(true)}
            className="h-20 px-12 rounded-[2rem] bg-[#066CF4] text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40 hover:bg-[#0556c5] transition-all active:scale-95 group"
        >
            <Plus className="mr-3 size-6 group-hover:rotate-90 transition-transform duration-300" />
            Choose Asset Type
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full opacity-40 grayscale pointer-events-none blur-[1px]">
            {assetCategories.slice(0, 2).map((cat) => (
                <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center gap-6">
                    <div className={cn("size-12 rounded-2xl flex items-center justify-center", cat.color)}>
                        <cat.icon size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-black text-gray-900">{cat.label}</h3>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* Type Selection Modal */}
      <Modal 
        isOpen={isTypeModalOpen} 
        onClose={() => setIsTypeModalOpen(false)}
        size="lg"
      >
        <div className="space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-gray-900">Choose Asset Type</h2>
                <p className="text-sm text-gray-500 font-medium">Select the format you want to create today</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assetCategories.map((cat) => (
                    <Link 
                        key={cat.id} 
                        href={`/dashboard/marketing-assets/create?type=${cat.id}`}
                        onClick={() => setIsTypeModalOpen(false)}
                    >
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gray-50 hover:bg-white p-6 rounded-[2rem] border-2 border-transparent hover:border-[#066CF4]/20 hover:shadow-xl transition-all flex flex-col gap-4 group"
                        >
                            <div className={cn("h-32 rounded-2xl flex items-center justify-center relative overflow-hidden", cat.color.replace('text-', 'bg-').replace('50', '100'))}>
                                <cat.icon size={48} className="opacity-20 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
                                        <cat.icon size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Sample View</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">{cat.label}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{cat.desc}</p>
                                </div>
                                <div className="size-10 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:text-[#066CF4] shadow-sm">
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
      </Modal>

      {/* Footer CTA */}
      <div className="pt-12">
        <Link href="/dashboard/marketing-assets/library">
            <Button variant="ghost" className="w-full h-16 rounded-[2rem] bg-white border-2 border-dashed border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 shadow-sm hover:bg-gray-50 hover:border-[#066CF4]/20 hover:text-[#066CF4] transition-all">
                <FileText className="mr-2 size-4" />
                View My Asset Library
            </Button>
        </Link>
      </div>
    </div>
  );
}
