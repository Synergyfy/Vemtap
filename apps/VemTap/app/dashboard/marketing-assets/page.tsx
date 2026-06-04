"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Archive, Download, QrCode, Plus, BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  useMarketingAssets,
  useAnalyticsOverview,
  useBrandProfile,
} from '@/services/marketing-assets/hooks';
import { useMyBusiness } from '@/services/businesses/hooks';
import { useBranches } from '@/services/branches/hooks';

const navItems = [
  { icon: Archive, label: 'My Assets', href: '/dashboard/marketing-assets/library', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Download, label: 'Downloads', href: '/dashboard/marketing-assets/analytics', color: 'text-secondary', bg: 'bg-secondary/10' },
  { icon: BarChart2, label: 'Analytics', href: '/dashboard/marketing-assets/analytics', color: 'text-primary-container', bg: 'bg-primary-container/10' },
  { icon: Settings, label: 'Brand Settings', href: '/dashboard/settings/profile', color: 'text-tertiary', bg: 'bg-tertiary/10' },
];

const statsConfig = [
  { key: 'assets', icon: Archive, label: 'Assets Created', color: 'text-primary' },
  { key: 'downloads', icon: Download, label: 'Downloads', color: 'text-secondary' },
  { key: 'scans', icon: QrCode, label: 'QR Scans', color: 'text-primary-container' },
];

export default function MarketingAssetsOverviewPage() {
  const { data: assets, isLoading: assetsLoading } = useMarketingAssets();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const { data: brandProfile } = useBrandProfile();
  const { data: business } = useMyBusiness();
  const { data: branches = [] } = useBranches();

  const recentAssets = assets
    ? assets.filter((a: any) => a.isActive !== false).slice(0, 3)
    : [];

  const totals = analytics?.totals || { scans: 0, views: 0, conversionRate: 0, downloads: 0 };

  const bizCatName = business?.category
    ? typeof (business as any).category === 'object'
      ? (business as any).category?.name
      : business.category
    : null;

  const statValues: Record<string, string> = {
    assets: assetsLoading ? '...' : (assets?.length || 0).toLocaleString(),
    downloads: analyticsLoading ? '...' : ((totals as any).downloads ?? 0).toLocaleString(),
    scans: analyticsLoading ? '...' : totals.scans.toLocaleString(),
  };

  return (
    <div className="pb-24 md:pb-10 space-y-5 md:space-y-6 max-w-2xl mx-auto">
      <p className="text-body-lg text-on-surface-variant text-sm md:text-base leading-relaxed">
        Create professional QR marketing materials for your business.
      </p>

      <section>
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20 flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary-container/10 flex items-center justify-center shrink-0">
            {brandProfile?.logoUrl ? (
              <img
                src={brandProfile.logoUrl}
                alt={brandProfile?.name || 'Logo'}
                className="size-full object-contain"
              />
            ) : (
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {(brandProfile?.name || 'V').charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-md font-semibold text-on-surface truncate">
              {brandProfile?.name || business?.name || 'Your Business'}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {bizCatName && (
                <span className="text-label-caps text-on-surface-variant capitalize">
                  {bizCatName}
                </span>
              )}
              {branches.length > 0 && (
                <>
                  <span className="w-1 h-1 bg-outline-variant rounded-full" />
                  <span className="text-label-caps text-on-surface-variant">
                    {branches.length} {branches.length === 1 ? 'Branch' : 'Branches'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="-mx-5 md:-mx-0">
        <div className="flex overflow-x-auto gap-3 px-5 md:px-0 pb-1 no-scrollbar">
          {statsConfig.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[140px] flex-shrink-0 bg-surface-container-low rounded-xl p-4 border border-outline-variant/10 shadow-sm"
              >
                <Icon size={20} className={`${stat.color} mb-2`} />
                <p className="text-label-caps text-on-surface-variant mb-0.5">{stat.label}</p>
                <p className="text-headline-md font-semibold text-on-surface">
                  {statValues[stat.key]}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <Link href="/dashboard/marketing-assets/create">
          <button className="w-full h-12 bg-primary text-on-primary font-button text-button rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 cursor-pointer">
            <Plus size={20} />
            Create New Marketing Asset
          </button>
        </Link>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-headline-md font-semibold text-on-surface">Recent Assets</h3>
          {recentAssets.length > 0 && (
            <Link
              href="/dashboard/marketing-assets/library"
              className="text-primary text-label-caps"
            >
              VIEW ALL
            </Link>
          )}
        </div>
        <div className="space-y-3">
          {assetsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-surface-container rounded-xl animate-pulse" />
            ))
          ) : recentAssets.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="inline-flex size-12 bg-surface-container-highest rounded-full items-center justify-center">
                <QrCode size={20} className="text-on-surface-variant" />
              </div>
              <p className="text-body-sm text-on-surface-variant">
                No materials designed yet. Tap the button above to get started.
              </p>
            </div>
          ) : (
            recentAssets.map((asset: any) => (
              <Link
                key={asset.id}
                href={`/dashboard/marketing-assets/library`}
                className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/20 flex items-center p-2 gap-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                  {asset.thumbnailUrl ? (
                    <img src={asset.thumbnailUrl} alt={asset.name} className="size-full object-cover" />
                  ) : (
                    <QrCode size={18} className="text-on-surface-variant opacity-40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-lg font-semibold text-on-surface truncate">
                    {asset.name}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    Created {new Date(asset.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button className="h-9 px-4 bg-surface-container-high rounded-full text-label-caps text-on-surface-variant active:scale-95 transition-transform shrink-0 cursor-pointer">
                  View
                </button>
              </Link>
            ))
          )}
        </div>
      </section>

      {!assetsLoading && recentAssets.length === 0 && (
        <section className="grid grid-cols-2 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="bg-surface-container-highest/40 p-4 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center gap-2 active:scale-95 transition-transform hover:bg-surface-container-highest/60"
              >
                <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon size={20} />
                </div>
                <p className="text-label-caps text-on-surface font-bold">{item.label}</p>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
