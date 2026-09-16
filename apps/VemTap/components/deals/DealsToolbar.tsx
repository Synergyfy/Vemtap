'use client';

import React from 'react';
import Link from 'next/link';
import { QrCode, ImagePlus } from 'lucide-react';

const C = {
  primary: '#0055c4',
  onSurface: '#191c1e',
  onSurfaceVariant: '#424655',
  outlineVariant: '#c2c6d7',
} as const;

interface DealsToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  activeLocation: string;
  onOpenLocation: () => void;
  isAuthenticated: boolean;
  dashboardHref: string;
  onOpenFilter?: () => void;
  onOpenMobileSearch?: () => void;
  hasActiveFilters?: boolean;
  selectedCategory?: string | null;
  onSelectCategory?: (cat: string | null) => void;
}

export default function DealsToolbar({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  activeLocation,
  onOpenLocation,
  isAuthenticated,
  dashboardHref,
  onOpenFilter,
  onOpenMobileSearch,
  hasActiveFilters,
  selectedCategory,
  onSelectCategory,
}: DealsToolbarProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors duration-200"
      style={{
        background: '#ffffff',
        borderBottom: `1px solid ${C.outlineVariant}`,
      }}
    >
      {/* Desktop: Top nav bar */}
      <div className="vemtap-container hidden md:flex items-center justify-between h-[64px] gap-6">
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-1">
            {[
              { label: 'Home', href: '/' },
              { label: 'Deals', href: '/deals' },
            ].map((item) => (
              <Link key={item.label} href={item.href}
                className="px-3 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                style={{ color: C.onSurface }}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form onSubmit={onSearchSubmit} className="flex-1 max-w-[500px] flex items-center">
          <div className="flex-1 relative">
            <input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full h-11 pl-4 pr-24 rounded-l-xl text-[14px] focus:outline-none border"
              style={{ border: `1px solid ${C.outlineVariant}`, borderRight: 'none', color: C.onSurface, background: '#ffffff' }}
              placeholder="Search deals, businesses..."
              type="text"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button type="button" title="Scan QR code" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" style={{ color: C.onSurfaceVariant }}>
                <QrCode size={18} />
              </button>
              <button type="button" title="Search by image" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" style={{ color: C.onSurfaceVariant }}>
                <ImagePlus size={18} />
              </button>
            </div>
          </div>
          <button type="submit" className="h-11 px-6 rounded-r-xl text-white font-bold text-[13px] uppercase tracking-wider" style={{ background: C.primary }}>
            Search
          </button>
        </form>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onOpenLocation} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-gray-50" style={{ color: C.onSurfaceVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
            <span className="truncate max-w-[140px]">{activeLocation}</span>
          </button>
          {isAuthenticated ? (
            <Link href={dashboardHref} className="h-10 px-5 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold flex items-center justify-center hover:bg-[#0557b3] transition-colors">
              My Dashboard
            </Link>
          ) : (
            <Link href="/login" className="h-10 px-5 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold flex items-center justify-center hover:bg-[#0557b3] transition-colors">
              Login
            </Link>
          )}
        </div>
      </div>
      {/* Desktop: Category rail */}
      {onSelectCategory && (
        <div className="hidden md:block border-t" style={{ borderColor: C.outlineVariant }}>
          <div className="vemtap-container flex items-center gap-1 h-[42px] overflow-x-auto no-scrollbar">
            {[
              { label: 'Food & Dining', icon: 'restaurant', query: 'food' },
              { label: 'Beauty & Spa', icon: 'spa', query: 'beauty' },
              { label: 'Fashion', icon: 'checkroom', query: 'fashion' },
              { label: 'Electronics', icon: 'devices', query: 'tech' },
              { label: 'Fitness', icon: 'fitness_center', query: 'fitness' },
              { label: 'Home & Office', icon: 'chair', query: 'home' },
              { label: 'Automotive', icon: 'directions_car', query: 'automotive' },
            ].map((cat) => (
              <button
                key={cat.label}
                onClick={() => onSelectCategory(cat.query || null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0"
                style={{
                  background: selectedCategory === cat.query ? C.primary : 'transparent',
                  color: selectedCategory === cat.query ? '#ffffff' : C.onSurfaceVariant,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-3 py-2">
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mx-2">
          <span className="material-symbols-outlined shrink-0" style={{ color: C.onSurfaceVariant, fontSize: 18 }}>location_on</span>
          <h1 className="text-[13px] font-semibold tracking-tight truncate" style={{ color: C.primary }}>{activeLocation}</h1>
        </div>
        <div className="flex items-center gap-1">
          {onOpenFilter && (
            <button onClick={onOpenFilter} className="w-11 h-11 flex items-center justify-center rounded-full relative" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>tune</span>
              {hasActiveFilters && (
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} />
              )}
            </button>
          )}
          {onOpenMobileSearch && (
            <button onClick={onOpenMobileSearch} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>search</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
