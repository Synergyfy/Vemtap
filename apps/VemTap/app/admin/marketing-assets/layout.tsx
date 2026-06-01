"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldAlert, Layers, Image as ImageIcon, Sparkles, BarChart2, Grid, Tags, Settings, Shield, ClipboardList, Download, Users, FileText, Palette, Crop } from 'lucide-react';

interface TabItem {
  label: string;
  href: string;
  icon: any;
}

const ADMIN_TABS: TabItem[] = [
  { label: 'Overview', href: '/admin/marketing-assets', icon: Grid },
  { label: 'Design Templates', href: '/admin/marketing-assets/templates', icon: Layers },
  { label: 'Categories', href: '/admin/marketing-assets/categories', icon: Tags },
  { label: 'Template Styles', href: '/admin/marketing-assets/template-styles', icon: Palette },
  { label: 'Formats', href: '/admin/marketing-assets/template-formats', icon: Crop },
  { label: 'Mockup Presets', href: '/admin/marketing-assets/mockups', icon: ImageIcon },
  { label: 'AI Prompts', href: '/admin/marketing-assets/ai-prompts', icon: Sparkles },
  { label: 'Platform Analytics', href: '/admin/marketing-assets/analytics', icon: BarChart2 },
  { label: 'Brand Rules', href: '/admin/marketing-assets/brand-rules', icon: Shield },
  { label: 'Generated Assets', href: '/admin/marketing-assets/generated-assets', icon: FileText },
  { label: 'Downloads', href: '/admin/marketing-assets/downloads', icon: Download },
  { label: 'Permissions', href: '/admin/marketing-assets/permissions', icon: Users },
  { label: 'System Settings', href: '/admin/marketing-assets/settings', icon: Settings },
  { label: 'Audit Logs', href: '/admin/marketing-assets/audit-logs', icon: ClipboardList },
];

export default function AdminMarketingAssetsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-primary size-7 md:size-8" />
            Marketing Assets Management
          </h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">
            Configure system layout templates, photorealistic mockup presets, and copywriter AI prompts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 pb-px">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar scroll-smooth">
          {ADMIN_TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href !== '/admin/marketing-assets' && pathname?.startsWith(tab.href));
            const Icon = tab.icon;

            return (
              <Link key={tab.href} href={tab.href} className="relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors rounded-t-xl hover:text-primary">
                <Icon size={16} className={isActive ? 'text-primary' : 'text-gray-400'} />
                <span className={isActive ? 'text-primary' : 'text-gray-500'}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="active-admin-marketing-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
