'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';
import { publicApi } from '@/lib/api';
import { offerToHomeDeal, formatNaira } from '@/components/home/mappers';
import LocationPrompt from '@/components/home/LocationPrompt';
import SearchModal from '@/components/home/SearchModal';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import type { HomeDealCard } from '@/components/home/types';

/* ─── Stitch colour tokens ─── */
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
  secondaryContainer: '#d0e1fb',
  onSecondaryContainer: '#191c1e',
  tertiaryContainer: '#6b738a',
  onTertiaryContainer: '#fcfaff',
  surfaceContainerLow: '#f2f4f6',
} as const;

/* ─── Sort options ─── */
const SORT_OPTIONS = [
  { id: 'trending', label: 'Trending', icon: 'trending_up' },
  { id: 'newest', label: 'Newest', icon: 'schedule' },
  { id: 'price_asc', label: 'Price: Low → High', icon: 'arrow_upward' },
  { id: 'price_desc', label: 'Price: High → Low', icon: 'arrow_downward' },
  { id: 'discount', label: 'Biggest Discount', icon: 'local_offer' },
] as const;

/* ─── Quick filter options ─── */
const QUICK_FILTER_OPTIONS = [
  { id: 'flash_sales', label: 'Flash Sales', icon: 'bolt' },
  { id: 'free', label: 'Free Deals', icon: 'redeem' },
  { id: 'ending_soon', label: 'Ending Soon', icon: 'timer' },
  { id: 'new_arrivals', label: 'New Arrivals', icon: 'fiber_new' },
] as const;

/* ─── Badge helper ─── */
function getBadge(offer: HomeDealCard): { label: string; color: string } | null {
  if (offer.discountPercent && offer.discountPercent >= 40) return { label: 'FLASH SALE', color: C.error };
  if (offer.discountLabel === 'FREE') return { label: 'FREE', color: '#16a34a' };
  if (offer.discountPercent && offer.discountPercent >= 20) return { label: `${offer.discountPercent}% OFF`, color: C.error };
  if (offer.discountLabel) return { label: offer.discountLabel, color: C.primaryContainer };
  return null;
}

/* ─── Unsplash fallback images for featured cards ─── */
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
];

function DealsPageInner() {
  const searchParams = useSearchParams();
  const { label: userLocationLabel, requestLocation } = useLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('trending');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);

  const bannerSlides = [
    {
      image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400&q=80',
      tag: 'Hot Deals',
      tagIcon: 'local_fire_department',
      heading: <>Up to <span className="text-yellow-300">70% Off</span></>,
      sub: 'Discover the best deals from businesses around you. Updated daily.',
      cta: 'Shop Now',
      gradient: 'linear-gradient(90deg, rgba(0,29,107,0.92) 0%, rgba(0,29,107,0.5) 50%, rgba(0,0,0,0) 100%)',
    },
    {
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
      tag: 'New Arrivals',
      tagIcon: 'fiber_new',
      heading: <>Fresh Finds <span className="text-emerald-300">Every Week</span></>,
      sub: 'Be the first to grab new products and services from top businesses.',
      cta: 'Explore',
      gradient: 'linear-gradient(90deg, rgba(16,50,30,0.92) 0%, rgba(16,50,30,0.5) 50%, rgba(0,0,0,0) 100%)',
    },
    {
      image: 'https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=1400&q=80',
      tag: 'Free Deals',
      tagIcon: 'redeem',
      heading: <>Grab <span className="text-orange-300">Freebies</span> Near You</>,
      sub: 'No cost, all benefit. Find free deals from local businesses today.',
      cta: 'View Free Deals',
      gradient: 'linear-gradient(90deg, rgba(80,20,0,0.92) 0%, rgba(80,20,0,0.5) 50%, rgba(0,0,0,0) 100%)',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  const activeLocation = userLocationLabel || 'Wuse 2, Abuja';

  // Seed search from URL
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    if (q) setSearchQuery(q);
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    const sort = searchParams.get('sortBy');
    if (sort) setSortBy(sort);
  }, [searchParams]);

  // Fetch live deals
  const { data: dealsData, isLoading, isError, refetch } = usePublicOffers({ limit: 20, sortBy: 'trending' });

  // Fetch public categories
  const { data: categoriesData } = useQuery({
    queryKey: ['public-categories'],
    queryFn: () => publicApi.get('/categories'),
    staleTime: 10 * 60 * 1000,
  });

  const categoriesList = useMemo(() => {
    const raw = categoriesData?.items ?? categoriesData?.data ?? categoriesData?.categories ?? categoriesData;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw
        .filter((c: any) => c.name && !c.name.toLowerCase().includes('frank'))
        .map((c: any) => ({
          id: c.id || c._id || c.slug,
          label: c.name || c.label || c.title || 'Category',
          slug: c.slug || c.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }));
    }
    return [];
  }, [categoriesData]);

  const dealsList = useMemo(() => {
    const fromApi = (dealsData?.data ?? []).map(offerToHomeDeal);
    if (fromApi.length > 0) {
      return fromApi.map((d: HomeDealCard, idx: number) => ({
        ...d,
        image: d.image || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length],
      }));
    }
    return [];
  }, [dealsData]);

  // Text + filter + category combined
  const filteredDeals = useMemo(() => {
    let result = dealsList;

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.businessName?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(d => {
        const dealCat = (d.categoryName || d.category || '').toLowerCase().replace(/\s+/g, '-');
        const dealTitle = (d.title || '').toLowerCase();
        const dealDesc = (d.description || '').toLowerCase();
        return dealCat.includes(selectedCategory.toLowerCase()) ||
               dealTitle.includes(selectedCategory.toLowerCase()) ||
               dealDesc.includes(selectedCategory.toLowerCase());
      });
    }

    // Price range filter
    const minPrice = priceRange.min ? Number(priceRange.min) : null;
    const maxPrice = priceRange.max ? Number(priceRange.max) : null;
    if (minPrice !== null || maxPrice !== null) {
      result = result.filter(d => {
        const price = d.dealPrice != null ? Number(d.dealPrice) : null;
        if (price === null) return true;
        if (minPrice !== null && price < minPrice) return false;
        if (maxPrice !== null && price > maxPrice) return false;
        return true;
      });
    }

    // Quick filter logic
    switch (quickFilter) {
      case 'flash_sales':
        result = result.filter(d => d.discountPercent && d.discountPercent >= 40);
        break;
      case 'new_arrivals':
        result = [...result].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'free':
        result = result.filter(d => d.dealPrice != null && Number(d.dealPrice) === 0);
        break;
      case 'ending_soon':
        result = [...result].sort((a, b) => {
          const endA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const endB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return endA - endB;
        });
        break;
    }

    // Sort logic
    switch (sortBy) {
      case 'newest':
        result = [...result].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'price_asc':
        result = [...result].sort((a, b) => {
          const priceA = a.dealPrice != null ? Number(a.dealPrice) : Infinity;
          const priceB = b.dealPrice != null ? Number(b.dealPrice) : Infinity;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        result = [...result].sort((a, b) => {
          const priceA = a.dealPrice != null ? Number(a.dealPrice) : -Infinity;
          const priceB = b.dealPrice != null ? Number(b.dealPrice) : -Infinity;
          return priceB - priceA;
        });
        break;
      case 'discount':
        result = [...result].sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      case 'trending':
      default:
        break;
    }

    return result;
  }, [dealsList, searchQuery, selectedCategory, priceRange, quickFilter, sortBy]);

  const allDeals = filteredDeals;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.onSurface }}>
      {/* ─── TopAppBar ─── */}
      <header
        className="sticky top-0 z-40 w-full transition-colors duration-200"
        style={{
          background: '#ffffff',
          borderBottom: `1px solid ${C.outlineVariant}`,
        }}
      >
        {/* Desktop: Top nav bar */}
        <div className="hidden md:flex items-center justify-between px-6 h-[64px] max-w-[1400px] mx-auto gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <img src="/VEMTAP_PNG.png" alt="VemTap" className="h-10 w-auto" />
            </Link>
            <nav className="flex items-center gap-1">
              {[
                { label: 'Home', href: '/' },
                { label: 'Deals', href: '/deals' },
                { label: 'Business', href: '/business-landing' },
                { label: 'Pricing', href: '/pricing' },
              ].map((item) => (
                <Link key={item.label} href={item.href}
                  className="px-3 py-2 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors"
                  style={{ color: C.onSurface }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[500px] flex">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11 px-4 rounded-l-xl text-[14px] focus:outline-none border"
              style={{ border: `1px solid ${C.outlineVariant}`, borderRight: 'none', color: C.onSurface, background: '#ffffff' }}
              placeholder="Search deals, businesses..."
              type="text"
            />
            <button type="submit" className="h-11 px-6 rounded-r-xl text-white font-bold text-[13px] uppercase tracking-wider" style={{ background: C.primary }}>
              Search
            </button>
          </form>
          <div className="flex items-center gap-1 shrink-0">
            <Link href="/auth/onboarding" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:bg-gray-50" style={{ color: C.onSurface }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
              Account
            </Link>
            <Link href="#" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors hover:bg-gray-50" style={{ color: C.onSurface }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>help</span>
              Help
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
            {[
              { label: 'All Deals', icon: 'local_offer', query: '' },
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
          <div className="flex items-center gap-1">
            <button onClick={() => setShowFilterModal(true)} className="w-11 h-11 flex items-center justify-center rounded-full relative" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>tune</span>
              {(quickFilter || selectedCategory || priceRange.min || priceRange.max || sortBy !== 'trending') && (
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} />
              )}
            </button>
            <button onClick={() => setIsSearchModalOpen(true)} className="w-11 h-11 flex items-center justify-center rounded-full" style={{ color: C.onSurfaceVariant }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>search</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1400px] mx-auto flex">
        {/* ─── Desktop Sidebar Filters (Collapsible) ─── */}
        <aside className="hidden md:block shrink-0 sticky top-[108px] h-[calc(100vh-108px)] border-r transition-all duration-300" style={{ borderColor: C.outlineVariant, background: '#ffffff', width: sidebarOpen ? 280 : 48 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-2 px-4 h-12 text-[13px] font-bold uppercase tracking-wider border-b transition-colors hover:bg-gray-50"
            style={{ borderColor: C.outlineVariant, color: C.onSurface }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, transition: 'transform 0.3s', transform: sidebarOpen ? 'rotate(0)' : 'rotate(180deg)' }}>filter_list</span>
            {sidebarOpen && <span>Filters</span>}
          </button>
          {sidebarOpen && (
            <div className="p-5 space-y-5 overflow-y-auto h-[calc(100vh-152px)]">
              {/* Sort By */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: '#727786' }}>Sort By</h4>
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: 'trending', label: 'Trending', icon: 'trending_up' },
                    { key: 'newest', label: 'Newest', icon: 'schedule' },
                    { key: 'price_asc', label: 'Price: Low → High', icon: 'arrow_upward' },
                    { key: 'price_desc', label: 'Price: High → Low', icon: 'arrow_downward' },
                    { key: 'discount', label: 'Biggest Discount', icon: 'local_offer' },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => setSortBy(opt.key)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left" style={{ background: sortBy === opt.key ? `${C.primary}10` : 'transparent', color: sortBy === opt.key ? C.primary : C.onSurfaceVariant }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ background: C.outlineVariant }} />

              {/* Quick Filters */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: '#727786' }}>Quick Filters</h4>
                <div className="flex flex-col gap-1.5">
                  {[
                    { key: 'flash_sales', label: 'Flash Sales', icon: 'bolt' },
                    { key: 'free_deals', label: 'Free Deals', icon: 'redeem' },
                    { key: 'ending_soon', label: 'Ending Soon', icon: 'timer' },
                    { key: 'new_arrivals', label: 'New Arrivals', icon: 'fiber_new' },
                  ].map((f) => (
                    <button key={f.key} onClick={() => setQuickFilter(quickFilter === f.key ? null : f.key)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left" style={{ background: quickFilter === f.key ? `${C.primary}10` : 'transparent', color: quickFilter === f.key ? C.primary : C.onSurfaceVariant }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{f.icon}</span>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ background: C.outlineVariant }} />

              {/* Category */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: '#727786' }}>Category</h4>
                <div className="relative">
                  <button onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors" style={{ border: `1px solid ${C.outlineVariant}`, background: '#ffffff', color: C.onSurface }}>
                    <span>{selectedCategory ? categoriesList.find(c => c.slug === selectedCategory)?.label || 'Category' : 'All Categories'}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, transition: 'transform 0.2s', transform: showCategoryDropdown ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto" style={{ background: '#ffffff', border: `1px solid ${C.outlineVariant}` }}>
                      <button onClick={() => { setSelectedCategory(null); setShowCategoryDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-left" style={{ background: !selectedCategory ? `${C.primary}10` : '#ffffff', color: !selectedCategory ? C.primary : C.onSurface }}>
                        All Categories
                      </button>
                      {categoriesList.map((cat) => (
                        <button key={cat.id} onClick={() => { setSelectedCategory(cat.slug); setShowCategoryDropdown(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium text-left" style={{ background: selectedCategory === cat.slug ? `${C.primary}10` : '#ffffff', color: selectedCategory === cat.slug ? C.primary : C.onSurface }}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px" style={{ background: C.outlineVariant }} />

              {/* Price Range */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5" style={{ color: '#727786' }}>Price Range</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#727786' }}>₦</span>
                    <input type="number" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} placeholder="Min" className="w-full h-9 pl-7 pr-2 rounded-lg text-[13px] focus:outline-none focus:ring-1" style={{ border: `1px solid ${C.outlineVariant}`, color: '#191c1e' }} />
                  </div>
                  <span className="text-[12px]" style={{ color: '#727786' }}>—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#727786' }}>₦</span>
                    <input type="number" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} placeholder="Max" className="w-full h-9 pl-7 pr-2 rounded-lg text-[13px] focus:outline-none focus:ring-1" style={{ border: `1px solid ${C.outlineVariant}`, color: '#191c1e' }} />
                  </div>
                </div>
              </div>

              {/* Clear + count */}
              <div className="pt-2 space-y-2">
                {(quickFilter || selectedCategory || priceRange.min || priceRange.max || sortBy !== 'trending') && (
                  <button onClick={() => { setQuickFilter(null); setSelectedCategory(null); setPriceRange({ min: '', max: '' }); setSortBy('trending'); }} className="w-full py-2 rounded-lg text-[12px] font-semibold border transition-colors" style={{ borderColor: C.outlineVariant, color: C.onSurfaceVariant }}>Clear all filters</button>
                )}
                <p className="text-[12px] font-medium text-center" style={{ color: C.onSurfaceVariant }}>
                  {allDeals.length} {allDeals.length === 1 ? 'deal' : 'deals'} found
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ─── Right Content ─── */}
        <main className="flex-1 min-w-0">
          {/* Desktop Banner Slider */}
          <div className="hidden md:block px-6 pt-5">
            <div className="relative rounded-2xl overflow-hidden group" style={{ minHeight: 220 }}>
              {bannerSlides.map((slide, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: i === bannerIndex ? 1 : 0, zIndex: i === bannerIndex ? 1 : 0 }}
                >
                  <img src={slide.image} alt={slide.tag} className="w-full h-full object-cover" style={{ minHeight: 220 }} />
                  <div className="absolute inset-0" style={{ background: slide.gradient }} />
                </div>
              ))}
              <div className="relative z-10 flex items-center p-8 lg:p-10" style={{ minHeight: 220 }}>
                <div className="flex-1 max-w-lg">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{bannerSlides[bannerIndex].tagIcon}</span>
                    {bannerSlides[bannerIndex].tag}
                  </span>
                  <h2 className="text-[28px] lg:text-[34px] font-black text-white leading-tight mb-2">{bannerSlides[bannerIndex].heading}</h2>
                  <p className="text-[14px] text-white/70 mb-5">{bannerSlides[bannerIndex].sub}</p>
                  <button className="px-6 py-2.5 rounded-full bg-white font-bold text-[12px] uppercase tracking-wider" style={{ color: C.primary }}>{bannerSlides[bannerIndex].cta}</button>
                </div>
              </div>
              {/* Left Arrow */}
              <button
                onClick={() => setBannerIndex((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.9)', color: C.onSurface, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_left</span>
              </button>
              {/* Right Arrow */}
              <button
                onClick={() => setBannerIndex((prev) => (prev + 1) % bannerSlides.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.9)', color: C.onSurface, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_right</span>
              </button>
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {bannerSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === bannerIndex ? 24 : 8,
                      height: 8,
                      background: i === bannerIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Deals Grid */}
          <div className="p-6">
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
            ) : allDeals.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allDeals.map((deal, i) => {
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
              <div className="text-center py-20">
                <div className="relative mx-auto size-16 mb-4">
                  <div className="absolute inset-0 rounded-2xl -rotate-6" style={{ background: `${C.primary}15` }} />
                  <div className="relative size-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#fff', border: `1px solid ${C.outlineVariant}` }}>🛍️</div>
                </div>
                <p className="font-bold text-sm" style={{ color: C.onSurface }}>No deals found</p>
                <p className="text-xs mt-1" style={{ color: C.outline }}>Try a different search or filter — new deals drop daily.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <PublicBottomNav />

      {/* ─── Location Modal ─── */}
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

      {/* ─── Search Modal ─── */}
      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      )}

      {/* ─── Advanced Filter Modal ─── */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            style={{ background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0" style={{ background: '#ffffff' }}>
              <div className="w-10 h-1 rounded-full" style={{ background: '#c2c6d7' }} />
            </div>

            {/* Title */}
            <div className="px-5 pb-4 flex items-center justify-between sticky top-3" style={{ background: '#ffffff' }}>
              <h3 className="text-[18px] font-semibold" style={{ color: '#191c1e' }}>
                Filter Deals
              </h3>
              <button
                onClick={() => { setQuickFilter(null); setSelectedCategory(null); setPriceRange({ min: '', max: '' }); setSortBy('trending'); setShowCategoryDropdown(false); }}
                className="text-[13px] font-semibold"
                style={{ color: '#0055c4' }}
              >
                Reset all
              </button>
            </div>

            <div className="px-5 pb-6 space-y-6">
              {/* Sort By */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#727786' }}>
                  Sort By
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
                      style={{
                        border: `1px solid ${sortBy === opt.id ? '#0055c4' : '#c2c6d7'}`,
                        background: sortBy === opt.id ? '#0055c4' : '#ffffff',
                        color: sortBy === opt.id ? '#ffffff' : '#191c1e',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#727786' }}>
                  Quick Filters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setQuickFilter(quickFilter === opt.id ? null : opt.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
                      style={{
                        border: `1px solid ${quickFilter === opt.id ? '#0055c4' : '#c2c6d7'}`,
                        background: quickFilter === opt.id ? '#0055c4' : '#ffffff',
                        color: quickFilter === opt.id ? '#ffffff' : '#191c1e',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#727786' }}>
                  Category
                </h4>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[14px] font-medium transition-all"
                  style={{
                    border: `1px solid ${selectedCategory ? '#0055c4' : '#c2c6d7'}`,
                    background: selectedCategory ? 'rgba(0, 85, 196, 0.05)' : '#ffffff',
                    color: '#191c1e',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: selectedCategory ? '#0055c4' : '#727786' }}>
                      category
                    </span>
                    {selectedCategory
                      ? categoriesList.find(c => c.slug === selectedCategory)?.label || selectedCategory
                      : 'All Categories'
                    }
                  </div>
                  <span
                    className="material-symbols-outlined transition-transform"
                    style={{
                      fontSize: 20,
                      color: '#727786',
                      transform: showCategoryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    expand_more
                  </span>
                </button>

                {/* Scrollable dropdown */}
                {showCategoryDropdown && (
                  <div
                    className="mt-2 rounded-xl overflow-hidden max-h-[240px] overflow-y-auto"
                    style={{ border: '1px solid #c2c6d7' }}
                  >
                    <button
                      onClick={() => { setSelectedCategory(null); setShowCategoryDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium transition-colors text-left"
                      style={{
                        background: !selectedCategory ? 'rgba(0, 85, 196, 0.08)' : '#ffffff',
                        color: !selectedCategory ? '#0055c4' : '#191c1e',
                        borderBottom: '1px solid #e6e8ea',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        apps
                      </span>
                      All Categories
                      {!selectedCategory && (
                        <span className="material-symbols-outlined ml-auto" style={{ fontSize: 20, color: '#0055c4' }}>check</span>
                      )}
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.slug); setShowCategoryDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium transition-colors text-left"
                        style={{
                          background: selectedCategory === cat.slug ? 'rgba(0, 85, 196, 0.08)' : '#ffffff',
                          color: selectedCategory === cat.slug ? '#0055c4' : '#191c1e',
                          borderBottom: '1px solid #e6e8ea',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                          label
                        </span>
                        {cat.label}
                        {selectedCategory === cat.slug && (
                          <span className="material-symbols-outlined ml-auto" style={{ fontSize: 20, color: '#0055c4' }}>check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#727786' }}>
                  Price Range
                </h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: '#727786' }}>₦</span>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      placeholder="Min"
                      className="w-full h-11 pl-8 pr-3 rounded-xl text-[14px] focus:outline-none focus:ring-2"
                      style={{
                        border: '1px solid #c2c6d7',
                        color: '#191c1e',
                        focusRing: '#0055c4',
                      }}
                    />
                  </div>
                  <span className="text-[14px]" style={{ color: '#727786' }}>—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: '#727786' }}>₦</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      placeholder="Max"
                      className="w-full h-11 pl-8 pr-3 rounded-xl text-[14px] focus:outline-none focus:ring-2"
                      style={{
                        border: '1px solid #c2c6d7',
                        color: '#191c1e',
                        focusRing: '#0055c4',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full h-12 rounded-full text-[14px] font-semibold active:scale-[0.98] transition-transform"
                style={{ background: '#0055c4', color: '#ffffff' }}
              >
                Show {filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: C.bg }} />}>
      <DealsPageInner />
    </Suspense>
  );
}
