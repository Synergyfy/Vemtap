"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Layers, Image as ImageIcon, Sparkles, BarChart2, Grid, Tags, Settings, Shield, ClipboardList, Download, Users, FileText, Palette, Crop, ChevronDown } from 'lucide-react';

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
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active tab object
  const activeTab = ADMIN_TABS.find(t => pathname === t.href || (t.href !== '/admin/marketing-assets' && pathname?.startsWith(t.href))) || ADMIN_TABS[0];
  const ActiveIcon = activeTab.icon;

  return (
    <div className="space-y-6 md:space-y-8 py-10 px-4 sm:px-6 md:px-8">
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

      {/* Tabs - Premium Custom Mobile Dropdown */}
      <div className="md:hidden relative w-full" ref={dropdownRef}>
        <label className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5 ml-1">Navigate Dashboard</label>
        
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3.5 bg-white border border-gray-150 rounded-2xl flex items-center justify-between text-sm font-bold text-gray-900 shadow-sm hover:border-primary/20 transition-all hover:bg-gray-50/50 cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <ActiveIcon size={18} className="text-primary shrink-0" />
            <span>{activeTab.label}</span>
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} 
          />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white/95 backdrop-blur border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[340px] overflow-y-auto no-scrollbar py-2"
            >
              {ADMIN_TABS.map((tab) => {
                const isTabActive = tab.href === activeTab.href;
                const TabIcon = tab.icon;

                return (
                  <button
                    key={tab.href}
                    onClick={() => {
                      router.push(tab.href);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 text-xs font-bold transition-all ${
                      isTabActive
                        ? 'bg-primary/5 text-primary border-l-4 border-primary pl-3'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`}
                  >
                    <TabIcon size={16} className={isTabActive ? 'text-primary' : 'text-gray-400'} />
                    <span>{tab.label}</span>
                    {isTabActive && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs - Desktop Horizontal Row */}
      <div className="hidden md:block border-b border-gray-100 pb-px">
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
