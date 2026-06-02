"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  TrendingUp, 
  Plus, 
  History, 
  ArrowRight,
  Sparkles,
  Award,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useMarketingAssets, useAnalyticsOverview, useBrandProfile, useDownloadsLog } from '@/services/marketing-assets/hooks';
import { Button } from '@/components/ui/button';
import RewardStatCard from '@/components/loyalty/RewardStatCard';

export default function MarketingAssetsOverviewPage() {
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: brandProfile } = useBrandProfile();
  const { data: downloads } = useDownloadsLog();

  // Pick first 3 active assets as recent ones (PRD §11 archived exclusion)
  const recentAssets = assets ? assets.filter((a: any) => a.isActive !== false).slice(0, 3) : [];

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };
  const totalDownloads = (totals as any).downloads ?? (downloads?.length || 0);

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Visual Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/25 to-purple-600/25 pointer-events-none mix-blend-multiply" />
        
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400">
            <Sparkles size={12} />
            Self-Service Creative Studio
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Design materials for {brandProfile?.name || 'your business'}
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Promote your services, menus, and reviews with beautiful physical cards and high-fidelity QR codes. No graphic designer required.
          </p>
        </div>

        <Link href="/dashboard/marketing-assets/templates" className="relative z-10">
          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl py-3 px-6 shadow-xl shadow-blue-600/20 border-none transition-all hover:scale-[1.02] flex items-center gap-2">
            <Plus size={16} className="stroke-[3px]" />
            Create Marketing Material
          </Button>
        </Link>
      </motion.div>

      {/* Analytics Summary Cards (PRD §11 — Total Assets, Downloads, QR Scans) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
        <RewardStatCard
          label="Total Assets"
          value={assetsLoading ? '...' : (assets?.length || 0).toLocaleString()}
          icon={Award}
          color="orange"
        />
        <RewardStatCard
          label="Total QR Scans"
          value={analyticsLoading ? '...' : totals.scans.toLocaleString()}
          icon={QrCode}
          color="green"
        />
        <RewardStatCard
          label="Total Downloads"
          value={analyticsLoading ? '...' : totalDownloads.toLocaleString()}
          icon={Download}
          color="blue"
        />
        <RewardStatCard
          label="Scan Conversion Rate"
          value={analyticsLoading ? '...' : `${totals.conversionRate}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="space-y-6 md:space-y-8">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Studio Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/dashboard/marketing-assets/templates" className="flex">
                <Button variant="outline" className="w-full h-auto py-3 md:py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-2 md:p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <QrCode size={18} className="md:size-5" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Choose Template</span>
                    <span className="text-[10px] text-gray-400 font-medium hidden sm:block">Browse preset catalog</span>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/marketing-assets/create" className="flex">
                <Button variant="outline" className="w-full h-auto py-3 md:py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-2 md:p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Create New</span>
                    <span className="text-[10px] text-gray-400 font-medium hidden sm:block">Start from scratch</span>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/marketing-assets/analytics" className="flex">
                <Button variant="outline" className="w-full h-auto py-3 md:py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-2 md:p-3 bg-green-50 text-green-600 rounded-xl">
                    <TrendingUp size={18} className="md:size-5" />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Scan Analytics</span>
                    <span className="text-[10px] text-gray-400 font-medium hidden sm:block">Audits scans & formats</span>
                  </div>
                </Button>
              </Link>
            </div>
          </section>

          {/* Recent Designs */}
          <section className="bg-white rounded-3xl border border-gray-100 p-4 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-xl">
                  <History size={18} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Recent Materials</h3>
              </div>
              {recentAssets.length > 0 && (
                <Link href="/dashboard/marketing-assets/library">
                  <Button variant="ghost" className="text-primary font-bold gap-2 hover:bg-primary/5 rounded-xl text-xs md:text-sm">
                    View All Library <ArrowRight size={14} />
                  </Button>
                </Link>
              )}
            </div>

            {assetsLoading ? (
              <div className="space-y-4 py-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : recentAssets.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="inline-flex size-14 bg-blue-50 text-blue-600 rounded-full items-center justify-center">
                  <QrCode size={24} />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="font-bold text-gray-900">No materials designed yet</h4>
                  <p className="text-xs text-gray-500">
                    Get started by designing your first table stand or poster in our interactive workspace.
                  </p>
                </div>
                <Link href="/dashboard/marketing-assets/templates">
                  <Button className="bg-primary hover:bg-primary/95 text-white font-bold rounded-xl mt-2 px-5 py-2">
                    Browse Templates Catalog
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0 group cursor-pointer">
                    <Link href={`/dashboard/marketing-assets/library`} className="flex items-center gap-4 flex-1">
                      <div className="size-12 rounded-xl bg-slate-50 border border-gray-100 hidden sm:flex items-center justify-center text-xs text-gray-400 group-hover:bg-primary/5 transition-colors overflow-hidden">
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.name} className="size-full object-cover" />
                        ) : (
                          <QrCode size={18} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm md:text-base">
                          {asset.name}
                        </h4>
                        <p className="text-xs text-gray-400 capitalize hidden sm:block">
                          {asset.type.replace('_', ' ')} • Saved {new Date(asset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>

                    <Link href={`/dashboard/marketing-assets/templates?id=${asset.templateId}`}>
                      <Button variant="ghost" className="text-primary hover:text-primary/90 font-bold text-[10px] md:text-xs gap-1.5 bg-primary/5 rounded-xl hover:bg-primary/10 px-2 md:px-3 py-1 md:py-1.5">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
      </div>
    </div>
  );
}
