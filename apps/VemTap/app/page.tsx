'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';
import { usePublicBusinesses } from '@/services/public/discovery-hooks';
import OnboardingFlow from '@/components/home/OnboardingFlow';
import LocationOnboardingFlow from '@/components/home/LocationOnboardingFlow';
import LocationPrompt from '@/components/home/LocationPrompt';
import SearchModal from '@/components/home/SearchModal';
import DealEngagementBar from '@/components/deals/DealEngagementBar';
import PublicBottomNav from '@/components/public/PublicBottomNav';
import { DealCardSkeleton, BusinessCardSkeleton } from '@/components/home/Skeletons';
import { offerToHomeDeal, formatNaira } from '@/components/home/mappers';
import type { HomeDealCard } from '@/components/home/types';
import type { PublicBusiness as DealPublicBusiness } from '@/services/deals/types';

const C = {
  bg: '#f7f9fb',
  surface: '#f7f9fb',
  primary: '#0055c4',
  onSurface: '#191c1e',
  onSurfaceVariant: '#424655',
  outline: '#727786',
  outlineVariant: '#c2c6d7',
} as const;

const SECTOR_COVERS: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  dining: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
  bar: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&h=400&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600&h=400&fit=crop',
  salon: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
  clothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
  retail: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
  electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  health: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  medical: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  home: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',
  automotive: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
  education: 'https://images.unsplash.com/photo-1523050854058-8df90110c8f1?w=600&h=400&fit=crop',
  default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
};

const FALLBACK_BUSINESSES = {
  featured: {
    id: 'orchid-bistro', name: 'The Orchid Bistro', category: 'Fine Dining',
    verified: true, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
    logoUrl: '', href: '/deals?q=Orchid+Bistro',
  },
  items: [
    { id: 'core-fitness', name: 'Core Fitness Studio', category: 'Boutique Gym & Spin',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
      logoUrl: '', href: '/deals?q=Core+Fitness' },
    { id: 'gentlemans-cut', name: "The Gentleman's Cut", category: 'Premium Barbershop',
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
      logoUrl: '', href: '/deals?q=The+Gentlemans+Cut' },
  ],
};

type Deal = {
  id: string; title: string; subtitle: string; badge: string; time: string;
  price: string | null; image: string; href: string; description: string; businessName: string;
};

function mapDeals(raw: ReturnType<typeof offerToHomeDeal>[], fallback: any[]): Deal[] {
  return raw.map((d, idx) => ({
    id: d.id,
    title: d.businessName || d.title,
    subtitle: d.title || d.description || 'Exclusive Offer',
    badge: d.discountLabel || (d.discountPercent ? `${d.discountPercent}% OFF` : 'DEAL'),
    time: d.endDate ? 'Limited Time' : 'Today',
    price: d.dealPrice != null ? (Number(d.dealPrice) === 0 ? 'FREE' : formatNaira(d.dealPrice)) : null,
    image: d.image || fallback[idx % fallback.length]?.image || fallback[0].image,
    href: d.href,
    description: d.description || '',
    businessName: d.businessName || d.title,
  }));
}

function DealCard({ deal }: { deal: Deal }) {
  const badgeColors: Record<string, string> = { 'DEAL': '#066CF4', 'FREE': '#16a34a', 'NEW': '#16a34a' };
  const badgeKey = deal.badge.includes('OFF') ? 'DEAL' : deal.badge;
  return (
    <Link
      href={deal.href}
      className="rounded-xl overflow-hidden shadow-sm relative group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: '#ffffff', border: `1px solid ${C.outlineVariant}` }}
    >
      <div className="h-[120px] md:h-[160px] relative w-full overflow-hidden" style={{ background: C.outlineVariant }}>
        <img src={deal.image} alt={deal.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md font-bold" style={{ background: badgeColors[badgeKey] || '#066CF4', color: '#ffffff', fontSize: 10, lineHeight: '14px' }}>
          {deal.badge}
        </div>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-[13px] md:text-[14px] font-semibold line-clamp-1" style={{ color: C.onSurface }}>{deal.title}</h3>
        <p className="text-[11px] md:text-[12px] line-clamp-1" style={{ color: C.onSurfaceVariant }}>{deal.subtitle}</p>
        <div className="flex items-center gap-2">
          {deal.price && <span className="text-[14px] md:text-[16px] font-bold" style={{ color: C.primary }}>{deal.price}</span>}
          <span className="text-[10px] md:text-[11px]" style={{ color: C.outline }}>{deal.time}</span>
        </div>
        <DealEngagementBar offerId={deal.id} offerTitle={deal.title} offerDescription={deal.description} dealUrl={deal.href} businessName={deal.businessName} compact />
      </div>
    </Link>
  );
}

function DealGrid({ deals, loading }: { deals: Deal[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <DealCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {deals.map((deal, i) => <DealCard key={deal.id || i} deal={deal} />)}
    </div>
  );
}

export default function Homepage() {
  const router = useRouter();
  const { label: userLocationLabel, requestLocation } = useLocation();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationOnboarding, setShowLocationOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('vemtap_onboarding_complete');
    const locationSet = localStorage.getItem('vemtap_location_set');
    if (!completed) setShowOnboarding(true);
    else if (!locationSet) setShowLocationOnboarding(true);
    setOnboardingChecked(true);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('vemtap_onboarding_complete', 'true');
    setShowOnboarding(false);
    if (!localStorage.getItem('vemtap_location_set')) setShowLocationOnboarding(true);
  };
  const handleLocationOnboardingComplete = () => {
    localStorage.setItem('vemtap_location_set', 'true');
    setShowLocationOnboarding(false);
  };

  const { data: dealsData, isLoading: dealsLoading } = usePublicOffers({ limit: 6, sortBy: 'trending' });
  const { data: trendingData, isLoading: trendingLoading } = usePublicOffers({ limit: 6, sortBy: 'trending' });
  const { data: newData, isLoading: newLoading } = usePublicOffers({ limit: 6, sortBy: 'newest' });
  const { data: businessesData, isLoading: businessesLoading } = usePublicBusinesses({ sortBy: 'popular', limit: 6 });

  const activeLocation = userLocationLabel || 'Wuse 2, Abuja';

  const getSectorCover = (catName?: string, catId?: string) => {
    const slug = (catName || catId || '').toLowerCase();
    const match = Object.keys(SECTOR_COVERS).find((k) => k !== 'default' && slug.includes(k));
    return match ? SECTOR_COVERS[match] : SECTOR_COVERS.default;
  };

  const popularBusinesses = useMemo(() => {
    const businesses: DealPublicBusiness[] =
      businessesData?.businesses || (businessesData as any)?.data?.businesses ||
      (Array.isArray((businessesData as any)?.data) ? (businessesData as any).data : []) || [];
    if (businesses.length > 0) {
      const categoryIcons: Record<string, string> = {
        food: 'restaurant', restaurant: 'restaurant', dining: 'restaurant',
        fashion: 'checkroom', retail: 'shopping_bag', beauty: 'spa',
        fitness: 'fitness_center', gym: 'fitness_center',
        electronics: 'devices', tech: 'devices',
        real_estate: 'real_estate_agent', automotive: 'directions_car',
      };
      const mapped = businesses.map((b) => ({
        id: b.id, name: b.name, category: b.categoryName || 'Business',
        image: getSectorCover(b.categoryName, b.categoryId), logoUrl: b.logoUrl || '',
        href: b.branchCode ? `/b/${b.branchCode}` : `/deals?q=${encodeURIComponent(b.name)}`,
        verified: b.isVerified ?? false,
        icon: categoryIcons[b.categoryId || ''] || categoryIcons[b.categoryName?.toLowerCase() || ''] || 'store',
      }));
      return { featured: mapped[0] || FALLBACK_BUSINESSES.featured, items: mapped.slice(1, 3) };
    }
    return FALLBACK_BUSINESSES;
  }, [businessesData]);

  const dealsList = useMemo(() => {
    const fromApi = (dealsData?.data ?? []).map(offerToHomeDeal);
    return fromApi.length > 0 ? mapDeals(fromApi, [{ image: '' }]) : [];
  }, [dealsData]);

  const trendingDeals = useMemo(() => {
    const fromApi = (trendingData?.data ?? []).map(offerToHomeDeal);
    return fromApi.length > 0 ? mapDeals(fromApi, [{ image: '' }]) : [];
  }, [trendingData]);

  const newDeals = useMemo(() => {
    const fromApi = (newData?.data ?? []).map(offerToHomeDeal);
    return fromApi.length > 0 ? mapDeals(fromApi, [{ image: '' }]) : [];
  }, [newData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/deals?search=${encodeURIComponent(searchQuery.trim())}`);
    else setIsSearchModalOpen(true);
  };

  if (!onboardingChecked) return null;
  if (showOnboarding) return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  if (showLocationOnboarding) return <LocationOnboardingFlow onComplete={handleLocationOnboardingComplete} />;

  return (
    <div className="min-h-screen font-sans" style={{ background: C.bg, color: C.onSurface }}>
      <header className="sticky top-0 z-40 w-full" style={{ background: '#ffffff', borderBottom: `1px solid ${C.outlineVariant}` }}>
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
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-11 px-4 rounded-l-xl text-[14px] focus:outline-none border"
              style={{ border: `1px solid ${C.outlineVariant}`, borderRight: 'none', color: C.onSurface, background: '#ffffff' }}
              placeholder="Search deals, businesses..." type="text" />
            <button type="submit" className="h-11 px-6 rounded-r-xl text-white font-bold text-[13px] uppercase tracking-wider" style={{ background: C.primary }}>Search</button>
          </form>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/auth/onboarding" className="h-10 px-5 rounded-xl bg-[#066CF4] text-white text-[13px] font-bold flex items-center justify-center hover:bg-[#0557b3] transition-colors">
              Login
            </Link>
          </div>
        </div>
        <div className="hidden md:block border-t" style={{ borderColor: C.outlineVariant }}>
          <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-1 h-[44px] overflow-x-auto no-scrollbar">
            {[{ label: 'All Deals', icon: 'local_offer' }, { label: 'Food & Dining', icon: 'restaurant' }, { label: 'Beauty & Spa', icon: 'spa' },
              { label: 'Fashion', icon: 'checkroom' }, { label: 'Electronics', icon: 'devices' }, { label: 'Fitness', icon: 'fitness_center' },
              { label: 'Home & Office', icon: 'chair' }, { label: 'Automotive', icon: 'directions_car' },
            ].map((cat) => (
              <Link key={cat.label} href={`/deals?category=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 hover:bg-gray-100"
                style={{ color: C.onSurfaceVariant }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>{cat.label}
              </Link>
            ))}
          </div>
        </div>
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

      <main className="max-w-[1400px] mx-auto pb-20 md:pb-0">
        <section className="px-4 md:px-6 pt-5">
          <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 200 }}>
            <img src="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1400&q=80" alt="Deals banner" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,29,107,0.88) 0%, rgba(0,29,107,0.4) 60%, rgba(0,0,0,0) 100%)' }} />
            <div className="relative p-6 md:p-8 lg:p-10">
              <h2 className="text-[24px] md:text-[32px] font-black text-white leading-tight mb-2">Discover Deals <span className="text-yellow-300">Near You</span></h2>
              <p className="text-[14px] text-white/80 mb-5 max-w-md">Explore the best offers from businesses in your area. Updated daily.</p>
              <button onClick={() => router.push('/deals')} className="px-6 py-2.5 rounded-full bg-white font-bold text-[12px] uppercase tracking-wider" style={{ color: C.primary }}>Browse Deals</button>
            </div>
          </div>
        </section>

        <section className="md:hidden px-4 pt-5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[{ label: 'Food', icon: 'restaurant' }, { label: 'Retail', icon: 'shopping_bag' }, { label: 'Beauty', icon: 'spa' },
              { label: 'Tech', icon: 'devices' }, { label: 'Real Estate', icon: 'real_estate_agent' }, { label: 'Fitness', icon: 'fitness_center' },
            ].map((cat) => (
              <Link key={cat.label} href={`/deals?category=${encodeURIComponent(cat.label)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0"
                style={{ border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant, background: '#ffffff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{cat.icon}</span>{cat.label}
              </Link>
            ))}
          </div>
        </section>

        {dealsList.length > 0 && (
          <section className="px-4 md:px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] md:text-[20px] font-bold" style={{ color: C.onSurface }}>Featured Deals</h2>
              <Link href="/deals" className="text-[13px] font-semibold" style={{ color: C.primary }}>View all</Link>
            </div>
            <DealGrid deals={dealsList} loading={dealsLoading} />
          </section>
        )}

        {trendingDeals.length > 0 && (
          <section className="px-4 md:px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ color: C.primary }}>trending_up</span>
                <h2 className="text-[16px] md:text-[20px] font-bold" style={{ color: C.onSurface }}>Trending Deals</h2>
              </div>
              <Link href="/deals?sortBy=trending" className="text-[13px] font-semibold" style={{ color: C.primary }}>View all</Link>
            </div>
            <DealGrid deals={trendingDeals} loading={trendingLoading} />
          </section>
        )}

        {newDeals.length > 0 && (
          <section className="px-4 md:px-6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#16a34a' }}>fiber_new</span>
                <h2 className="text-[16px] md:text-[20px] font-bold" style={{ color: C.onSurface }}>New Deals</h2>
              </div>
              <Link href="/deals?sortBy=newest" className="text-[13px] font-semibold" style={{ color: C.primary }}>View all</Link>
            </div>
            <DealGrid deals={newDeals} loading={newLoading} />
          </section>
        )}

        <section className="px-4 md:px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] md:text-[20px] font-bold uppercase tracking-wider" style={{ color: C.onSurface }}>Popular Businesses</h2>
            {businessesData?.businesses && businessesData.businesses.length > 0 && (
              <Link href="/deals" className="text-[13px] font-semibold" style={{ color: C.primary }}>View all</Link>
            )}
          </div>
          {businessesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <BusinessCardSkeleton className="md:col-span-2 md:row-span-2 h-[320px] sm:h-[380px] rounded-2xl" />
              {Array.from({ length: 2 }).map((_, i) => <BusinessCardSkeleton key={i} className="w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href={popularBusinesses.featured.href}
                className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden bg-[#eceef0] border border-[#e0e3e5] shadow-sm group cursor-pointer min-h-[320px] sm:min-h-[380px] flex flex-col justify-end">
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url('${popularBusinesses.featured.image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <div className="relative z-10 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {popularBusinesses.featured.verified && (
                      <span className="bg-[#0055c4] text-white px-2.5 py-1 rounded text-[12px] font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span>Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {popularBusinesses.featured.logoUrl && (
                      <img src={popularBusinesses.featured.logoUrl} alt="" className="w-9 h-9 rounded-lg object-cover bg-white shrink-0" />
                    )}
                    <h3 className="text-[24px] sm:text-[28px] font-bold text-white tracking-tight truncate">{popularBusinesses.featured.name}</h3>
                  </div>
                  <p className="text-[14px] text-[#f7f9fb] flex items-center gap-1 font-normal opacity-95">
                    <span className="material-symbols-outlined text-[16px]">{(popularBusinesses.featured as any).icon || 'store'}</span>
                    {popularBusinesses.featured.category}
                  </p>
                </div>
              </Link>
              {popularBusinesses.items.map((item: any) => (
                <Link key={item.id} href={item.href}
                  className="rounded-xl overflow-hidden bg-white border border-[#e0e3e5] shadow-sm group cursor-pointer flex flex-col">
                  <div className="h-[140px] relative overflow-hidden bg-[#eceef0]">
                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300" style={{ backgroundImage: `url('${item.image}')` }} />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {item.logoUrl && <img src={item.logoUrl} alt="" className="w-6 h-6 rounded-md object-cover bg-white shrink-0" />}
                        <h4 className="text-[14px] font-semibold text-[#191c1e] truncate">{item.name}</h4>
                      </div>
                      <p className="text-[13px] text-[#727786] line-clamp-1">{item.category}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicBottomNav />
      {isLocationModalOpen && (
        <LocationPrompt isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)}
          onAllowLocation={() => { requestLocation(); setIsLocationModalOpen(false); }} />
      )}
      {isSearchModalOpen && <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />}
    </div>
  );
}
