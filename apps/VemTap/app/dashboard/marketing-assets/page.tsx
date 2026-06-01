"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode, 
  Eye, 
  TrendingUp, 
  Plus, 
  History, 
  Palette, 
  ArrowRight,
  Sparkles,
  Award,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useMarketingAssets, useAnalyticsOverview, useBrandProfile, useDownloadsLog } from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';
import { Button } from '@/components/ui/button';
import RewardStatCard from '@/components/loyalty/RewardStatCard';

export default function MarketingAssetsOverviewPage() {
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: brandProfile } = useBrandProfile();
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();
  const { data: downloads } = useDownloadsLog();

  // Pick first 3 active assets as recent ones (PRD §11 archived exclusion)
  const recentAssets = assets ? assets.filter((a: any) => a.isActive !== false).slice(0, 3) : [];

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };
  const totalDownloads = (totals as any).downloads ?? (downloads?.length || 0);

  return (
    <div className="space-y-8 pb-10">
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

      {/* Business Profile Summary Card (PRD §11) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="size-16 rounded-2xl bg-slate-50 border border-gray-100 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
            {business?.logoUrl || brandProfile?.logoUrl ? (
              <img src={business?.logoUrl || brandProfile?.logoUrl} alt="Business logo" className="size-full object-contain rounded-xl" />
            ) : (
              <div className="size-full rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xl">
                {business?.name?.charAt(0) || 'B'}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-gray-900 text-base md:text-lg flex items-center gap-2 flex-wrap">
              {business?.name || 'My Business'}
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
                {business?.category?.name || business?.category || 'General'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed max-w-md">
              {brandProfile?.tagline || business?.tagline || 'Self-service physical marketing assets & scan analytics dashboard.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-8 self-start md:self-auto w-full md:w-auto justify-between md:justify-end px-2 md:px-0 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
          <div className="text-left md:text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Active Plan</span>
            <span className="text-sm font-extrabold text-primary flex items-center gap-1">
              Pro Premium
            </span>
          </div>
          
          <div className="text-left md:text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Branches</span>
            <span className="text-sm font-extrabold text-gray-900">
              {branches.length || 1} Registered
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">QR Code Health</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-extrabold border border-green-200 mt-0.5">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column: Quick Actions & Recent Materials */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Studio Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/dashboard/marketing-assets/templates" className="flex">
                <Button variant="outline" className="w-full h-auto py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <QrCode size={20} />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Choose Template</span>
                    <span className="text-[10px] text-gray-400 font-medium">Browse preset catalog</span>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/marketing-assets/brand-settings" className="flex">
                <Button variant="outline" className="w-full h-auto py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <Palette size={20} />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Brand Custom Style</span>
                    <span className="text-[10px] text-gray-400 font-medium">Configure logos & colors</span>
                  </div>
                </Button>
              </Link>
              <Link href="/dashboard/marketing-assets/analytics" className="flex">
                <Button variant="outline" className="w-full h-auto py-5 flex-col gap-3 rounded-2xl border-gray-100 bg-white hover:bg-gray-50 text-gray-900 shadow-sm transition-all hover:scale-[1.02]">
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                  <div className="text-center">
                    <span className="font-bold block text-sm">Scan Analytics</span>
                    <span className="text-[10px] text-gray-400 font-medium">Audits scans & formats</span>
                  </div>
                </Button>
              </Link>
            </div>
          </section>

          {/* Recent Designs */}
          <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
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
                      <div className="size-12 rounded-xl bg-slate-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400 group-hover:bg-primary/5 transition-colors overflow-hidden">
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
                        <p className="text-xs text-gray-400 capitalize">
                          {asset.type.replace('_', ' ')} • Saved {new Date(asset.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>

                    <Link href={`/dashboard/marketing-assets/templates?id=${asset.templateId}`}>
                      <Button variant="ghost" className="text-primary hover:text-primary/90 font-bold text-xs gap-1.5 bg-primary/5 rounded-xl hover:bg-primary/10">
                        Edit
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Creative Insight Tips */}
        <div className="space-y-6 md:space-y-8">
          <section className="bg-blue-600/5 rounded-3xl p-6 md:p-8 border border-blue-600/10">
            <h3 className="text-md font-bold text-primary mb-3 flex items-center gap-2">
              <Award size={18} />
              Creative Recommendations
            </h3>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Placing <span className="font-bold text-blue-600">Table Stand QR codes</span> directly at checkout or dining tables increases reviews by up to <span className="font-bold text-blue-600">3x</span>. 
              <br /><br />
              Make sure to configure your custom tagline under brand settings for extra brand alignment!
            </p>
            <Link href="/dashboard/marketing-assets/brand-settings">
              <Button className="w-full mt-5 bg-blue-600 text-white rounded-xl font-bold h-11">
                Customize Brand Presets
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
