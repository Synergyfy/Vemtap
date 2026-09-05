'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';
import { getEngagement } from '@/services/deals/engagement';
import { getLocalSavedIds } from '@/services/deals/engagement-hooks';
import { useAuthStore } from '@/store/useAuthStore';
import { offerToHomeDeal, formatNaira } from '@/components/home/mappers';
import LocationPrompt from '@/components/home/LocationPrompt';
import SearchModal from '@/components/home/SearchModal';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import type { HomeDealCard } from '@/components/home/types';

/* ─── Stitch colour tokens (same as deals page) ─── */
const C = {
  bg: '#f7f9fb',
  surface: '#f7f9fb',
  primary: '#0055c4',
  onSurface: '#191c1e',
  onSurfaceVariant: '#424655',
  outline: '#727786',
  outlineVariant: '#c2c6d7',
  error: '#ba1a1a',
  primaryContainer: '#066cf4',
  onPrimaryContainer: '#fcfaff',
} as const;

/* ─── Badge helper (same as deals page) ─── */
function getBadge(offer: HomeDealCard): { label: string; color: string } | null {
  if (offer.discountPercent && offer.discountPercent >= 40) return { label: 'FLASH SALE', color: C.error };
  if (offer.discountLabel === 'FREE') return { label: 'FREE', color: '#16a34a' };
  if (offer.discountPercent && offer.discountPercent >= 20) return { label: `${offer.discountPercent}% OFF`, color: C.error };
  if (offer.discountLabel) return { label: offer.discountLabel, color: C.primaryContainer };
  return null;
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
];

const TOP_NAV = [
  { label: 'Home', href: '/' },
  { label: 'Deals', href: '/deals' },
  { label: 'Saved', href: '/saved' },
  { label: 'Pricing', href: '/pricing' },
];

const CATEGORY_RAIL = [
  { label: 'All Deals', icon: 'local_offer', query: '' },
  { label: 'Food & Dining', icon: 'restaurant', query: 'food' },
  { label: 'Beauty & Spa', icon: 'spa', query: 'beauty' },
  { label: 'Fashion', icon: 'checkroom', query: 'fashion' },
  { label: 'Electronics', icon: 'devices', query: 'tech' },
  { label: 'Fitness', icon: 'fitness_center', query: 'fitness' },
  { label: 'Home & Office', icon: 'chair', query: 'home' },
  { label: 'Automotive', icon: 'directions_car', query: 'automotive' },
];

export default function SavedDealsPage() {
  const { label: userLocationLabel, requestLocation } = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [localSavedIds, setLocalSavedIds] = useState<string[]>([]);

  const activeLocation = userLocationLabel || 'Wuse 2, Abuja';

  // Keep local mirror in sync (updated by useToggleSave + other tabs)
  useEffect(() => {
    setLocalSavedIds(getLocalSavedIds());
    const sync = () => setLocalSavedIds(getLocalSavedIds());
    window.addEventListener('vemtap-saved-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('vemtap-saved-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Fetch live deals (same source as deals page)
  const { data: dealsData, isLoading } = usePublicOffers({ limit: 40, sortBy: 'trending' });

  const dealsList = useMemo(() => {
    const fromApi = (dealsData?.data ?? []).map(offerToHomeDeal);
    return fromApi.map((d: HomeDealCard, idx: number) => ({
      ...d,
      image: d.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
    }));
  }, [dealsData]);

  // Backend source of truth per offer (same query keys as DealEngagementBar, so cache is shared)
  const engagementQueries = useQueries({
    queries: dealsList.map((d) => ({
      queryKey: ['deals', 'engagement', d.id],
      queryFn: () => getEngagement(d.id),
      staleTime: 60 * 1000,
      enabled: isAuthenticated && !!d.id,
    })),
  });

  const savedDeals = useMemo(() => {
    const localSet = new Set(localSavedIds);
    const kept = dealsList.filter((d, i) => {
      const backendSaved = engagementQueries[i]?.data?.isSaved ?? false;
      return backendSaved || localSet.has(d.id);
    });

    const q = searchQuery.trim().toLowerCase();
    const byQuery = q
      ? kept.filter((d) =>
          d.title?.toLowerCase().includes(q) ||
          d.businessName?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q)
        )
      : kept;

    if (!selectedCategory) return byQuery;
    return byQuery.filter((d) => {
      const dealCat = (d.category || '').toLowerCase();
      const dealTitle = (d.title || '').toLowerCase();
      const dealDesc = (d.description || '').toLowerCase();
      return (
        dealCat.includes(selectedCategory.toLowerCase()) ||
        dealTitle.includes(selectedCategory.toLowerCase()) ||
        dealDesc.includes(selectedCategory.toLowerCase())
      );
    });
  }, [dealsList, engagementQueries, localSavedIds, searchQuery, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) setIsSearchModalOpen(true);
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.onSurface }}>
      {/* ─── TopAppBar ─── */}
      <header
        className="sticky top-0 z-40 w-full transition-colors duration-200"
        style={{ background: '#ffffff', borderBottom: `1px solid ${C.outlineVariant}` }}
      >
        {/* Desktop: Top nav bar */}
        <div className="hidden md:flex items-center justify-between px-6 h-[64px] max-w-[1400px] mx-auto gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-10 w-auto" />
            </Link>
            <nav className="flex items-center gap-1">
              {TOP_NAV.map((item) => {
                const isActive = item.href === '/saved';
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="px-3 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                    style={{ color: isActive ? C.primary : C.onSurface }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[500px] flex">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11 px-4 rounded-l-xl text-[14px] focus:outline-none border"
              style={{ border: `1px solid ${C.outlineVariant}`, borderRight: 'none', color: C.onSurface, background: '#ffffff' }}
              placeholder="Search saved deals..."
              type="text"
            />
            <button type="submit" className="h-11 px-6 rounded-r-xl text-white font-bold text-[13px] uppercase tracking-wider" style={{ background: C.primary }}>
              Search
            </button>
          </form>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login" className="h-10 px-5 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold flex items-center justify-center hover:bg-[#0557b3] transition-colors">
              Login
            </Link>
            <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors hover:bg-gray-50" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
              <span className="truncate max-w-[140px]">{activeLocation}</span>
            </button>
          </div>
        </div>
        {/* Desktop: Category rail */}
        <div className="hidden md:block border-t" style={{ borderColor: C.outlineVariant }}>
          <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 h-[44px] overflow-x-auto no-scrollbar">
            {CATEGORY_RAIL.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.query || null)}
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
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-3 py-2">
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mx-2">
            <span className="material-symbols-outlined shrink-0" style={{ color: C.onSurfaceVariant, fontSize: 18 }}>location_on</span>
            <h1 className="text-[13px] font-semibold tracking-tight truncate" style={{ color: C.primary }}>{activeLocation}</h1>
          </div>
          <button onClick={() => setIsSearchModalOpen(true)} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ color: C.onSurfaceVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>search</span>
          </button>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="max-w-[1400px] mx-auto pb-20 md:pb-10">
        <div className="px-4 md:px-6 pt-5 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[20px] md:text-[24px] font-black tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: C.primary, fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              Saved Deals
            </h1>
            <p className="text-[13px] mt-1" style={{ color: C.onSurfaceVariant }}>
              {savedDeals.length} {savedDeals.length === 1 ? 'deal' : 'deals'} bookmarked
            </p>
          </div>
          <Link href="/deals" className="text-[13px] font-semibold shrink-0" style={{ color: C.primary }}>
            Discover deals
          </Link>
        </div>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden animate-pulse" style={{ background: C.surface, border: `1px solid ${C.outlineVariant}` }}>
                  <div className="h-32 lg:h-40 w-full" style={{ background: C.outlineVariant }} />
                  <div className="p-3 space-y-2">
                    <div className="h-4 rounded w-3/4" style={{ background: C.outlineVariant }} />
                    <div className="h-3 rounded w-1/2" style={{ background: C.outlineVariant }} />
                    <div className="h-5 rounded w-1/3" style={{ background: C.outlineVariant }} />
                  </div>
                </div>
              ))}
            </div>
          ) : !isAuthenticated && localSavedIds.length === 0 ? (
            <div className="text-center py-20 max-w-sm mx-auto">
              <div className="relative mx-auto size-16 mb-4">
                <div className="absolute inset-0 rounded-2xl -rotate-6" style={{ background: `${C.primary}15` }} />
                <div className="relative size-16 rounded-2xl flex items-center justify-center" style={{ background: '#fff', border: `1px solid ${C.outlineVariant}` }}>
                  <span className="material-symbols-outlined text-[28px]" style={{ color: C.primary }}>bookmark</span>
                </div>
              </div>
              <p className="font-bold text-[15px]" style={{ color: C.onSurface }}>Sign in to see saved deals</p>
              <p className="text-xs mt-1 mb-5" style={{ color: C.outline }}>Bookmarked deals sync to your account on any device.</p>
              <Link href="/login" className="inline-flex h-11 px-8 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold items-center justify-center hover:bg-[#0557b3] transition-colors">
                Login
              </Link>
            </div>
          ) : savedDeals.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedDeals.map((deal) => {
                const badge = getBadge(deal);
                return (
                  <Link key={deal.id} href={deal.href} className="rounded-xl overflow-hidden shadow-sm relative group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ background: C.surface, border: `1px solid ${C.outlineVariant}` }}>
                    <div className="h-32 lg:h-40 relative w-full overflow-hidden" style={{ background: C.outlineVariant }}>
                      <img src={deal.image} alt={deal.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      {badge && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold" style={{ background: badge.color, color: '#ffffff', fontSize: 10, lineHeight: '14px' }}>
                          {badge.label}
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <div className="min-w-0">
                        <h3 className="text-[13px] lg:text-[14px] font-semibold leading-[18px] line-clamp-1" style={{ color: C.onSurface }}>{deal.title}</h3>
                        <p className="text-[11px] leading-[14px] line-clamp-1 mt-0.5" style={{ color: C.onSurfaceVariant }}>{deal.businessName}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {deal.dealPrice != null && (
                          <span className="text-[15px] lg:text-[16px] font-bold" style={{ color: C.primary }}>
                            {Number(deal.dealPrice) === 0 ? 'FREE' : formatNaira(deal.dealPrice)}
                          </span>
                        )}
                        {deal.originalPrice && deal.dealPrice && Number(deal.originalPrice) > Number(deal.dealPrice) && (
                          <span className="text-[11px] line-through" style={{ color: C.outline }}>{formatNaira(deal.originalPrice)}</span>
                        )}
                      </div>
                      <DealEngagementBar offerId={deal.id} offerTitle={deal.title} offerDescription={deal.description || ''} dealUrl={deal.href} businessName={deal.businessName} compact />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 max-w-sm mx-auto">
              <div className="relative mx-auto size-16 mb-4">
                <div className="absolute inset-0 rounded-2xl -rotate-6" style={{ background: `${C.primary}15` }} />
                <div className="relative size-16 rounded-2xl flex items-center justify-center" style={{ background: '#fff', border: `1px solid ${C.outlineVariant}` }}>
                  <span className="material-symbols-outlined text-[28px]" style={{ color: C.primary }}>bookmark_border</span>
                </div>
              </div>
              <p className="font-bold text-[15px]" style={{ color: C.onSurface }}>No saved deals yet</p>
              <p className="text-xs mt-1 mb-5" style={{ color: C.outline }}>Tap the bookmark icon on any deal to save it here.</p>
              <Link href="/deals" className="inline-flex h-11 px-8 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold items-center justify-center hover:bg-[#0557b3] transition-colors">
                Browse deals
              </Link>
            </div>
          )}
        </div>
      </main>

      <PublicBottomNav />

      {isLocationModalOpen && (
        <LocationPrompt
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onAllowLocation={() => {
            requestLocation();
            setIsLocationModalOpen(false);
          }}
        />
      )}

      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}
    </div>
  );
}
