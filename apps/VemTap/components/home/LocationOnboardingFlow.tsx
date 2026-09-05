'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Search, X, Star, Store, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';

const SUGGESTED_LOCATIONS = ['Wuse 2', 'Garki', 'Maitama', 'Apo', 'Gwarinpa', 'Jabi', 'Katampe', 'Life Camp'];

const SECTOR_COVERS: Record<string, string> = {
  food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  dining: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  cafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
  bar: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=400&h=300&fit=crop',
  salon: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
  retail: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
  electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  health: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
  home: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
  automotive: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
  default: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
};

function getSectorImage(category?: string) {
  const slug = (category || '').toLowerCase();
  const match = Object.keys(SECTOR_COVERS).find((k) => k !== 'default' && slug.includes(k));
  return match ? SECTOR_COVERS[match] : SECTOR_COVERS.default;
}

interface LocationOnboardingFlowProps {
  onComplete: () => void;
}

function LocationPermissionScreen({ onUseLocation, onChooseManually, isRequesting, error, isDesktop }: any) {
  const illustration = (
    <div className="w-64 h-64 mb-8 relative">
      <div className="absolute inset-0 rounded-full bg-blue-100/60" />
      <div className="absolute inset-0 rounded-full border border-blue-200/40 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full p-6">
            <g stroke="#CBD5E1" strokeWidth="1" fill="none" opacity="0.5">
              <line x1="20" y1="40" x2="180" y2="40" /><line x1="20" y1="70" x2="180" y2="70" />
              <line x1="20" y1="100" x2="180" y2="100" /><line x1="20" y1="130" x2="180" y2="130" />
              <line x1="20" y1="160" x2="180" y2="160" /><line x1="50" y1="20" x2="50" y2="180" />
              <line x1="80" y1="20" x2="80" y2="180" /><line x1="110" y1="20" x2="110" y2="180" />
              <line x1="140" y1="20" x2="140" y2="180" /><line x1="170" y1="20" x2="170" y2="180" />
            </g>
            <g stroke="#E2E8F0" strokeWidth="3" fill="none">
              <line x1="20" y1="85" x2="180" y2="85" /><line x1="100" y1="20" x2="100" y2="180" />
            </g>
            <g fill="#CBD5E1" opacity="0.4">
              <rect x="25" y="45" width="20" height="15" rx="2" /><rect x="55" y="42" width="18" height="18" rx="2" />
              <rect x="115" y="45" width="22" height="14" rx="2" /><rect x="145" y="43" width="20" height="16" rx="2" />
              <rect x="25" y="108" width="22" height="16" rx="2" /><rect x="55" y="105" width="18" height="19" rx="2" />
              <rect x="115" y="107" width="20" height="15" rx="2" /><rect x="145" y="110" width="18" height="12" rx="2" />
            </g>
            <circle cx="100" cy="85" r="20" fill="#066CF4" opacity="0.15" />
            <circle cx="100" cy="85" r="8" fill="#066CF4" />
            <circle cx="100" cy="85" r="3" fill="white" />
          </svg>
        </div>
      </div>
      <div className="absolute -top-2 -right-2 size-12 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
        <Star size={18} className="text-amber-500" fill="currentColor" />
      </div>
      <div className="absolute -bottom-1 -left-1 size-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
        <Store size={16} className="text-[#066CF4]" />
      </div>
    </div>
  );

  const content = (
    <>
      <div className="space-y-2 max-w-[280px]">
        <h1 className="text-[28px] md:text-[36px] font-black text-gray-900 tracking-tight">Discover what&apos;s near you.</h1>
        <p className="text-sm md:text-[15px] text-gray-500 leading-relaxed">Use your location to see nearby businesses and deals.</p>
      </div>
      {error && (
        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center max-w-sm">{error}</p>
      )}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button onClick={onUseLocation} disabled={isRequesting}
          className="w-full h-14 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70">
          {isRequesting ? <><Loader2 size={18} className="animate-spin" />Getting Location...</> : <><Navigation size={18} />Use My Location</>}
        </button>
        <button onClick={onChooseManually}
          className="w-full h-14 bg-white text-[#066CF4] font-bold text-sm rounded-xl border border-[#066CF4]/20 hover:bg-blue-50 flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer">
          Choose Location Manually
        </button>
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 bg-[#F7F9FB] flex overflow-hidden">
        <div className="w-1/2 bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-12">
          {illustration}
        </div>
        <div className="w-1/2 flex flex-col items-center justify-center text-center px-12 gap-8">
          <div className="flex justify-end w-full absolute top-6 right-6">
            <button onClick={onChooseManually} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm transition-colors cursor-pointer">Skip</button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      <div className="flex justify-end px-5 pt-5 z-10">
        <button onClick={onChooseManually} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm transition-colors cursor-pointer">Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 -mt-10">
        {illustration}
        {content}
      </div>
    </div>
  );
}

function ManualLocationScreen({ onBack, onSelect, onUseCurrentLocation, isSaving, error, isDesktop }: any) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = SUGGESTED_LOCATIONS.filter(loc => loc.toLowerCase().includes(search.toLowerCase()));
  const handleContinue = () => { if (selected && !isSaving) onSelect(selected); };

  const searchSection = (
    <div className="space-y-5">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city, area or neighbourhood"
          className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#066CF4] focus:border-[#066CF4] transition-colors" />
        {search && <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>}
      </div>
      <button onClick={onUseCurrentLocation} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors w-full text-left cursor-pointer">
        <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-[#066CF4] shrink-0"><Navigation size={18} /></div>
        <div><p className="text-sm font-bold text-[#066CF4]">Use current location</p><p className="text-[11px] text-gray-400">Enable location services</p></div>
      </button>
      <div className="h-px bg-gray-100 w-full" />
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Suggested Locations</p>
        <div className="flex flex-col gap-2">
          {filtered.map((loc) => (
            <button key={loc} onClick={() => setSelected(loc)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all w-full text-left cursor-pointer ${selected === loc ? 'border-[#066CF4] bg-blue-50/50' : 'border-transparent hover:bg-white'}`}>
              <div className="flex items-center gap-3">
                <MapPin size={18} className={selected === loc ? 'text-[#066CF4]' : 'text-gray-400'} />
                <span className="text-sm font-medium text-gray-900">{loc}</span>
              </div>
              {selected === loc && (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#066CF4" /><path d="M5.5 9L8 11.5L12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const bottomButton = (
    <div className={`shrink-0 ${isDesktop ? '' : 'px-5 py-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]'} space-y-2`}>
      {error && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center">{error}</p>}
      <button onClick={handleContinue} disabled={!selected || isSaving}
        className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${selected && !isSaving ? 'bg-[#066CF4] text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]' : 'bg-gray-100 text-gray-400'}`}>
        {isSaving && <Loader2 size={16} className="animate-spin" />}{isSaving ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 bg-[#F7F9FB] flex overflow-hidden">
        <div className="w-1/2 bg-white border-r border-gray-100 flex flex-col">
          <div className="flex items-center px-6 py-4 border-b border-gray-100 shrink-0">
            <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer"><ArrowLeft size={20} className="text-gray-600" /></button>
            <h1 className="text-base font-bold text-[#066CF4] ml-3">Choose Your Location</h1>
          </div>
          <div className="flex-1 overflow-y-auto p-6">{searchSection}</div>
          <div className="p-6 border-t border-gray-100">{bottomButton}</div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-12">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6"><MapPin size={32} className="text-[#066CF4]" /></div>
            <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">Select Your Area</h2>
            <p className="text-[15px] text-gray-500">Choose your location to discover businesses and deals nearby.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer"><ArrowLeft size={20} className="text-gray-600" /></button>
        <h1 className="text-base font-bold text-[#066CF4]">Choose Your Location</h1>
        <div className="size-10" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">{searchSection}</div>
      {bottomButton}
    </div>
  );
}

function LocationConfirmedScreen({ location, onStartExploring, onChangeLocation, isDesktop }: any) {
  const { data: dealsData } = usePublicOffers({ limit: 5, sortBy: 'trending' });
  const deals = dealsData?.data || [];

  const successContent = (
    <div className="flex flex-col items-center text-center mb-8">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="size-24 bg-[#066CF4] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <motion.path d="M12 24L20 32L36 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }} />
        </svg>
      </motion.div>
      <h2 className="text-[28px] md:text-[36px] font-black text-gray-900 tracking-tight mb-2">Location Confirmed</h2>
      <p className="text-sm md:text-[15px] text-gray-500 max-w-xs leading-relaxed">Great. We&apos;ll use this location to show businesses and deals around you.</p>
    </div>
  );

  const dealCard = (deal: any, i: number) => {
    const dealImage = deal.business?.photos?.[0] || deal.mainImage || deal.image || getSectorImage(deal.business?.categoryName || deal.categoryName);
    return (
    <motion.div key={deal.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
      className="min-w-[200px] w-[200px] relative rounded-2xl overflow-hidden shadow-lg snap-center flex-shrink-0 group cursor-pointer" style={{ aspectRatio: '3/4' }}>
      <img src={dealImage} alt={deal.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
      {deal.discountPercent && <div className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">-{deal.discountPercent}% OFF</div>}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="flex items-center gap-1 mb-1">
          <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Nearby</span>
        </div>
        <h4 className="text-[14px] font-black text-white leading-tight mb-0.5 drop-shadow-lg">{deal.name}</h4>
        <p className="text-[11px] text-white/70 mb-2">{deal.business?.categoryName || 'Business'}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[16px] font-black text-white drop-shadow-md">{deal.dealPrice ? `₦${Number(deal.dealPrice).toLocaleString()}` : 'View'}</span>
            {deal.originalPrice && <span className="text-[10px] text-white/50 line-through">₦{Number(deal.originalPrice).toLocaleString()}</span>}
          </div>
          <div className="flex items-center gap-0.5 bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Star size={9} className="text-amber-400" fill="currentColor" />
            <span className="text-[9px] font-bold text-white">4.{8 - i}</span>
          </div>
        </div>
      </div>
    </motion.div>
    );
  };

  const fallbackCard = (name: string, category: string, price: number, origPrice: number, discount: number, idx: number) => {
    const img = getSectorImage(category);
    return (
    <div key={idx} className="min-w-[200px] w-[200px] relative rounded-2xl overflow-hidden shadow-lg snap-center flex-shrink-0" style={{ aspectRatio: '3/4' }}>
      <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
      {discount > 0 && <div className="absolute top-2.5 right-2.5 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">-{discount}% OFF</div>}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="flex items-center gap-1 mb-1">
          <div className="size-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Nearby</span>
        </div>
        <h4 className="text-[14px] font-black text-white leading-tight mb-0.5 drop-shadow-lg">{name}</h4>
        <p className="text-[11px] text-white/70 mb-2">{category}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-[16px] font-black text-white drop-shadow-md">₦{price.toLocaleString()}</span>
            <span className="text-[10px] text-white/50 line-through">₦{origPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-0.5 bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Star size={9} className="text-amber-400" fill="currentColor" />
            <span className="text-[9px] font-bold text-white">4.{8 - idx}</span>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const buttons = (
    <div className="flex flex-col gap-3 max-w-sm w-full">
      <button onClick={onStartExploring} className="w-full h-12 bg-[#066CF4] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer">Start Exploring</button>
      <button onClick={onChangeLocation} className="w-full h-12 bg-transparent border border-[#066CF4] text-[#066CF4] rounded-xl font-bold text-sm hover:bg-blue-50 flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer">Change Location</button>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="absolute inset-0 bg-[#F7F9FB] flex overflow-hidden">
        <div className="w-1/2 flex flex-col justify-center items-center p-12">{successContent}{buttons}</div>
        <div className="w-1/2 bg-white border-l border-gray-100 flex flex-col overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-100 shrink-0">
            <h3 className="text-lg font-bold text-gray-900">Nearby Deals</h3>
            <span className="text-[10px] font-bold text-[#066CF4] uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-2 gap-4">
              {(deals.length > 0 ? deals.slice(0, 4) : [
                { id: '1', name: 'Urban Grind Cafe', business: { categoryName: 'Cafe & Bakery' }, dealPrice: 4500, originalPrice: 5600, discountPercent: 20 },
                { id: '2', name: 'Oasis Spa & Wellness', business: { categoryName: 'Health & Beauty' }, dealPrice: 12750, originalPrice: 15000, discountPercent: 15 },
                { id: '3', name: 'Fresh Bites Kitchen', business: { categoryName: 'Food & Dining' }, dealPrice: 3200, originalPrice: 4000, discountPercent: 20 },
                { id: '4', name: 'Style Hub Salon', business: { categoryName: 'Beauty & Spa' }, dealPrice: 8500, originalPrice: 10000, discountPercent: 15 },
              ]).map((deal: any, i: number) => {
                const dealImage = deal.business?.photos?.[0] || deal.mainImage || deal.image || getSectorImage(deal.business?.categoryName || deal.categoryName);
                return (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                  className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer"
                  style={{ aspectRatio: '3/4' }}
                >
                  <img src={dealImage} alt={deal.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
                  {deal.discountPercent && (
                    <div className="absolute top-3 right-3 bg-rose-500 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-sm">-{deal.discountPercent}% OFF</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Nearby</span>
                    </div>
                    <h4 className="text-[16px] font-black text-white leading-tight mb-1 drop-shadow-lg">{deal.name}</h4>
                    <p className="text-[12px] text-white/70 mb-2.5">{deal.business?.categoryName || 'Business'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[18px] font-black text-white drop-shadow-md">{deal.dealPrice ? `₦${Number(deal.dealPrice).toLocaleString()}` : 'View'}</span>
                        {deal.originalPrice && <span className="text-[11px] text-white/50 line-through">₦{Number(deal.originalPrice).toLocaleString()}</span>}
                      </div>
                      <div className="flex items-center gap-0.5 bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5">
                        <Star size={10} className="text-amber-400" fill="currentColor" />
                        <span className="text-[10px] font-bold text-white">4.{8 - i}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onChangeLocation} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer"><ArrowLeft size={20} className="text-gray-600" /></button>
        <h1 className="text-sm font-bold text-[#066CF4] truncate mx-4 flex items-center gap-1.5"><MapPin size={14} />{location}</h1>
        <button onClick={onChangeLocation} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer"><MapPin size={18} className="text-gray-500" /></button>
      </div>
      <main className="flex-1 overflow-y-auto pt-8 pb-32">
        {successContent}
        <div className="mt-4">
          <div className="px-5 flex justify-between items-end mb-4"><h3 className="text-base font-bold text-gray-900">Nearby Deals</h3><span className="text-[10px] font-bold text-[#066CF4] uppercase tracking-wider">Preview</span></div>
          <div className="flex overflow-x-auto scrollbar-hide px-5 gap-3.5 pb-4 snap-x snap-mandatory">
            {deals.length > 0 ? deals.map((d: any, i: number) => dealCard(d, i)) : (
              <>
                {fallbackCard('Urban Grind Cafe', 'Cafe & Bakery', 4500, 5600, 20, 0)}
                {fallbackCard('Oasis Spa & Wellness', 'Health & Beauty', 12750, 15000, 15, 1)}
                {fallbackCard('Fresh Bites Kitchen', 'Food & Dining', 3200, 4000, 20, 2)}
              </>
            )}
            <div className="min-w-[200px] w-[200px] relative rounded-2xl overflow-hidden shadow-lg snap-center flex-shrink-0 bg-gradient-to-br from-[#066CF4] to-blue-700 flex flex-col items-center justify-center gap-3" style={{ aspectRatio: '3/4' }}>
              <div className="size-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Store size={24} className="text-white" />
              </div>
              <div className="text-center px-4">
                <p className="text-[14px] font-black text-white mb-1">Explore More</p>
                <p className="text-[11px] text-white/70">View all deals nearby</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 max-w-md mx-auto w-full">{buttons}</div>
      </div>
    </div>
  );
}

export default function LocationOnboardingFlow({ onComplete }: LocationOnboardingFlowProps) {
  const [step, setStep] = useState<'permission' | 'manual' | 'confirmed'>('permission');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const { requestLocation, setManualLocation, isLoading } = useLocation();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleUseLocation = useCallback(async () => {
    setError(null);
    const result = await requestLocation();
    if (!result.ok) { setError(result.message); return; }
    setSelectedLocation(result.label || 'Your Area');
    setStep('confirmed');
  }, [requestLocation]);

  const handleChooseManually = useCallback(() => { setError(null); setStep('manual'); }, []);

  const handleSelectLocation = useCallback(async (location: string) => {
    setError(null);
    const ok = await setManualLocation(location);
    if (!ok) { setError('Could not find that location. Please try another area.'); return; }
    setSelectedLocation(location);
    setStep('confirmed');
  }, [setManualLocation]);

  const variants = {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-[#F7F9FB] overflow-hidden">
      <div className="w-full h-full max-w-none mx-auto relative bg-[#F7F9FB]">
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={variants} initial="enter" animate="center" exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute inset-0">
            {step === 'permission' && <LocationPermissionScreen onUseLocation={handleUseLocation} onChooseManually={handleChooseManually} isRequesting={isLoading} error={error} isDesktop={isDesktop} />}
            {step === 'manual' && <ManualLocationScreen onBack={() => setStep('permission')} onSelect={handleSelectLocation} onUseCurrentLocation={handleUseLocation} isSaving={isLoading} error={error} isDesktop={isDesktop} />}
            {step === 'confirmed' && <LocationConfirmedScreen location={selectedLocation} onStartExploring={onComplete} onChangeLocation={() => setStep('manual')} isDesktop={isDesktop} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
