'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowLeft, Search, X, Star, Store, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { usePublicOffers } from '@/services/deals/hooks';

const SUGGESTED_LOCATIONS = [
  'Wuse 2',
  'Garki',
  'Maitama',
  'Apo',
  'Gwarinpa',
  'Jabi',
  'Katampe',
  'Life Camp',
];

interface LocationOnboardingFlowProps {
  onComplete: () => void;
}

function LocationPermissionScreen({ onUseLocation, onChooseManually, isRequesting, error }: { onUseLocation: () => void; onChooseManually: () => void; isRequesting: boolean; error: string | null }) {
  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      {/* Skip button */}
      <div className="flex justify-end px-5 pt-5 z-10">
        <button
          onClick={onChooseManually}
          className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 -mt-10">
        {/* Illustration */}
        <div className="w-64 h-64 mb-8 relative">
          <div className="absolute inset-0 rounded-full bg-blue-100/60" />
          <div className="absolute inset-0 rounded-full border border-blue-200/40 animate-ping opacity-30" style={{ animationDuration: '3s' }} />
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full p-6">
                {/* Map grid */}
                <g stroke="#CBD5E1" strokeWidth="1" fill="none" opacity="0.5">
                  <line x1="20" y1="40" x2="180" y2="40" />
                  <line x1="20" y1="70" x2="180" y2="70" />
                  <line x1="20" y1="100" x2="180" y2="100" />
                  <line x1="20" y1="130" x2="180" y2="130" />
                  <line x1="20" y1="160" x2="180" y2="160" />
                  <line x1="50" y1="20" x2="50" y2="180" />
                  <line x1="80" y1="20" x2="80" y2="180" />
                  <line x1="110" y1="20" x2="110" y2="180" />
                  <line x1="140" y1="20" x2="140" y2="180" />
                  <line x1="170" y1="20" x2="170" y2="180" />
                </g>
                {/* Roads */}
                <g stroke="#E2E8F0" strokeWidth="3" fill="none">
                  <line x1="20" y1="85" x2="180" y2="85" />
                  <line x1="100" y1="20" x2="100" y2="180" />
                </g>
                {/* Buildings */}
                <g fill="#CBD5E1" opacity="0.4">
                  <rect x="25" y="45" width="20" height="15" rx="2" />
                  <rect x="55" y="42" width="18" height="18" rx="2" />
                  <rect x="115" y="45" width="22" height="14" rx="2" />
                  <rect x="145" y="43" width="20" height="16" rx="2" />
                  <rect x="25" y="108" width="22" height="16" rx="2" />
                  <rect x="55" y="105" width="18" height="19" rx="2" />
                  <rect x="115" y="107" width="20" height="15" rx="2" />
                  <rect x="145" y="110" width="18" height="12" rx="2" />
                </g>
                {/* Pin */}
                <circle cx="100" cy="85" r="20" fill="#066CF4" opacity="0.15" />
                <circle cx="100" cy="85" r="8" fill="#066CF4" />
                <circle cx="100" cy="85" r="3" fill="white" />
              </svg>
            </div>
          </div>
          {/* Floating elements */}
          <div className="absolute -top-2 -right-2 size-12 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
            <Star size={18} className="text-amber-500" fill="currentColor" />
          </div>
          <div className="absolute -bottom-1 -left-1 size-10 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
            <Store size={16} className="text-[#066CF4]" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2 max-w-[280px]">
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight">Discover what&apos;s near you.</h1>
          <p className="text-sm text-gray-500 leading-relaxed">Use your location to see nearby businesses and deals.</p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-6 pb-8 pt-4 space-y-3 z-10">
        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center">
            {error}
          </p>
        )}
        <button
          onClick={onUseLocation}
          disabled={isRequesting}
          className="w-full h-14 bg-[#066CF4] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
        >
          {isRequesting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Getting Location...
            </>
          ) : (
            <>
              <Navigation size={18} />
              Use My Location
            </>
          )}
        </button>
        <button
          onClick={onChooseManually}
          className="w-full h-14 bg-white text-[#066CF4] font-bold text-sm rounded-xl border border-[#066CF4]/20 hover:bg-blue-50 flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
        >
          Choose Location Manually
        </button>
      </div>
    </div>
  );
}

function ManualLocationScreen({ onBack, onSelect, onUseCurrentLocation, isSaving, error }: { onBack: () => void; onSelect: (location: string) => void; onUseCurrentLocation: () => void; isSaving: boolean; error: string | null }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = SUGGESTED_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (selected && !isSaving) onSelect(selected);
  };

  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-base font-bold text-[#066CF4]">Choose Your Location</h1>
        <div className="size-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, area or neighbourhood"
            className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#066CF4] focus:border-[#066CF4] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Current location */}
        <button onClick={onUseCurrentLocation} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white transition-colors w-full text-left cursor-pointer">
          <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-[#066CF4] shrink-0">
            <Navigation size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#066CF4]">Use current location</p>
            <p className="text-[11px] text-gray-400">Enable location services</p>
          </div>
        </button>

        <div className="h-px bg-gray-100 w-full" />

        {/* Suggested */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Suggested Locations</p>
          <div className="flex flex-col gap-2">
            {filtered.map((loc) => (
              <button
                key={loc}
                onClick={() => setSelected(loc)}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all w-full text-left cursor-pointer ${
                  selected === loc
                    ? 'border-[#066CF4] bg-blue-50/50'
                    : 'border-transparent hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} className={selected === loc ? 'text-[#066CF4]' : 'text-gray-400'} />
                  <span className="text-sm font-medium text-gray-900">{loc}</span>
                </div>
                {selected === loc && (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <circle cx="9" cy="9" r="9" fill="#066CF4" />
                    <path d="M5.5 9L8 11.5L12.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom button */}
      <div className="px-5 py-4 bg-white border-t border-gray-100 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] space-y-2">
        {error && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-center">
            {error}
          </p>
        )}
        <button
          onClick={handleContinue}
          disabled={!selected || isSaving}
          className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            selected && !isSaving
              ? 'bg-[#066CF4] text-white shadow-lg shadow-blue-500/20 active:scale-[0.98]'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function LocationConfirmedScreen({ location, onStartExploring, onChangeLocation }: { location: string; onStartExploring: () => void; onChangeLocation: () => void }) {
  const { data: dealsData } = usePublicOffers({ limit: 5, sortBy: 'trending' });
  const deals = dealsData?.data || [];

  return (
    <div className="absolute inset-0 bg-[#F7F9FB] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
        <button onClick={onChangeLocation} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-sm font-bold text-[#066CF4] truncate mx-4 flex items-center gap-1.5">
          <MapPin size={14} />
          {location}
        </h1>
        <button onClick={onChangeLocation} className="size-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <MapPin size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pt-8 pb-32">
        {/* Success checkmark */}
        <div className="px-5 flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="size-24 bg-[#066CF4] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <motion.path
                d="M12 24L20 32L36 16"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
          <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">Location Confirmed</h2>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Great. We&apos;ll use this location to show businesses and deals around you.
          </p>
        </div>

        {/* Preview rail */}
        <div className="mt-4">
          <div className="px-5 flex justify-between items-end mb-4">
            <h3 className="text-base font-bold text-gray-900">Nearby Deals</h3>
            <span className="text-[10px] font-bold text-[#066CF4] uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide px-5 gap-4 pb-4 snap-x snap-mandatory">
            {deals.length > 0 ? deals.map((deal: any, i: number) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="min-w-[240px] w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-center flex flex-col"
              >
                <div className="h-32 w-full bg-gradient-to-br from-blue-100 to-blue-50 relative flex items-center justify-center">
                  {deal.business?.photos?.[0] ? (
                    <img src={deal.business.photos[0]} alt={deal.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store size={32} className="text-[#066CF4]/40" />
                  )}
                  {deal.discountPercent && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      -{deal.discountPercent}%
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-xs font-bold text-gray-900 truncate pr-2">{deal.name}</h4>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 shrink-0">
                      <Star size={10} className="text-amber-500 mr-0.5" fill="currentColor" />
                      4.{8 - i}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">{deal.business?.categoryName || 'Business'}</p>
                  <div className="mt-auto">
                    <span className="text-xs font-bold text-gray-900">
                      {deal.dealPrice ? `₦${Number(deal.dealPrice).toLocaleString()}` : 'View Deal'}
                    </span>
                    {deal.originalPrice && (
                      <span className="text-[10px] text-gray-400 line-through ml-1">
                        ₦{Number(deal.originalPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )) : (
              // Fallback if no deals loaded
              <>
                <div className="min-w-[240px] w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-center flex flex-col">
                  <div className="h-32 w-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <Store size={32} className="text-[#066CF4]/40" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Urban Grind Cafe</h4>
                    <p className="text-[10px] text-gray-400 mb-2">0.5 km away • Cafe & Bakery</p>
                    <div>
                      <span className="text-xs font-bold text-gray-900">₦4,500</span>
                      <span className="text-[10px] text-gray-400 line-through ml-1">₦5,600</span>
                    </div>
                  </div>
                </div>
                <div className="min-w-[240px] w-[240px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-center flex flex-col">
                  <div className="h-32 w-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <Store size={32} className="text-purple-400/40" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">Oasis Spa & Wellness</h4>
                    <p className="text-[10px] text-gray-400 mb-2">1.2 km away • Health & Beauty</p>
                    <div>
                      <span className="text-xs font-bold text-gray-900">₦12,750</span>
                      <span className="text-[10px] text-gray-400 line-through ml-1">₦15,000</span>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Explore more card */}
            <div className="min-w-[240px] w-[240px] bg-blue-50 rounded-xl border border-blue-100 overflow-hidden snap-center flex flex-col items-center justify-center py-8">
              <Store size={32} className="text-[#066CF4]/60 mb-2" />
              <p className="text-xs font-bold text-gray-900 mb-0.5">Explore More</p>
              <p className="text-[10px] text-gray-500">View all deals nearby</p>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
          <button
            onClick={onStartExploring}
            className="w-full h-12 bg-[#066CF4] text-white rounded-xl font-bold text-sm flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            Start Exploring
          </button>
          <button
            onClick={onChangeLocation}
            className="w-full h-12 bg-transparent border border-[#066CF4] text-[#066CF4] rounded-xl font-bold text-sm hover:bg-blue-50 flex items-center justify-center active:scale-[0.98] transition-all cursor-pointer"
          >
            Change Location
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationOnboardingFlow({ onComplete }: LocationOnboardingFlowProps) {
  const [step, setStep] = useState<'permission' | 'manual' | 'confirmed'>('permission');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { requestLocation, setManualLocation, isLoading } = useLocation();

  const handleUseLocation = useCallback(async () => {
    setError(null);
    const result = await requestLocation();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSelectedLocation(result.label || 'Your Area');
    setStep('confirmed');
  }, [requestLocation]);

  const handleChooseManually = useCallback(() => {
    setError(null);
    setStep('manual');
  }, []);

  const handleSelectLocation = useCallback(async (location: string) => {
    setError(null);
    const ok = await setManualLocation(location);
    if (!ok) {
      setError('Could not find that location. Please try another area.');
      return;
    }
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
      <div className="w-full h-full max-w-md mx-auto relative bg-[#F7F9FB] shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0"
          >
            {step === 'permission' && (
              <LocationPermissionScreen
                onUseLocation={handleUseLocation}
                onChooseManually={handleChooseManually}
                isRequesting={isLoading}
                error={error}
              />
            )}
            {step === 'manual' && (
              <ManualLocationScreen
                onBack={() => setStep('permission')}
                onSelect={handleSelectLocation}
                onUseCurrentLocation={handleUseLocation}
                isSaving={isLoading}
                error={error}
              />
            )}
            {step === 'confirmed' && (
              <LocationConfirmedScreen
                location={selectedLocation}
                onStartExploring={onComplete}
                onChangeLocation={() => setStep('manual')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
