'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/hooks/useLocation';
import LocationPrompt from './LocationPrompt';
import Link from 'next/link';

const HERO_SLIDES = [
  {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    alt: 'People enjoying a local restaurant',
  },
  {
    src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop',
    alt: 'Cozy neighborhood cafe',
  },
  {
    src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop',
    alt: 'Fine dining experience nearby',
  },
];

const SLIDE_INTERVAL_MS = 5000;

export default function HomeHero() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const location = useLocation();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleSearchClick = () => {
    if (location.hasLocation) {
      router.push('/deals');
    } else {
      setShowLocationPrompt(true);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative pt-20 md:pt-28 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {/* Photo slideshow card */}
            <div className="relative h-64 sm:h-80 rounded-[1.75rem] overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 shadow-lg shadow-blue-900/10 mb-6">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={HERO_SLIDES[slide].src}
                    alt={HERO_SLIDES[slide].alt}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
              {location.label && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full max-w-[calc(100%-2rem)]"
                >
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{location.label}</span>
                </motion.div>
              )}
              <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-900 bg-white/95 px-3 py-1.5 rounded-full shadow-md">
                <Star size={12} className="text-amber-500" fill="currentColor" />
                4.8 · 2,400+ places
              </div>
              {/* Slide dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === slide ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>

            <h1 className="text-[32px] sm:text-4xl font-black text-gray-900 leading-[1.1] tracking-tight mb-3">
              Discover what&apos;s
              <br />
              around you.
            </h1>
            <p className="text-[15px] text-gray-500 mb-6 max-w-md leading-relaxed">
              Find nearby businesses, deals, products and services.
            </p>

            {/* Search bar */}
            <div className="relative max-w-lg mb-4">
              <div className="flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="pl-4 text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder={location.hasLocation ? `Searching in ${location.label?.split(',')[0] || 'your area'}` : 'Search deals, businesses, products...'}
                  className="flex-1 h-12 px-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none bg-transparent min-w-0"
                  readOnly
                  onClick={handleSearchClick}
                />
                <button
                  onClick={handleSearchClick}
                  className="h-10 px-5 mr-1.5 rounded-full bg-[#066CF4] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <MapPin size={14} />
                  {location.label ? (
                    <span className="max-w-[80px] truncate">{location.label.split(',')[0]}</span>
                  ) : (
                    'Near Me'
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 max-w-lg">
              <Link href="/deals">
                <button className="w-full h-14 rounded-full bg-[#066CF4] text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer">
                  Start Exploring
                </button>
              </Link>
              <Link href="/how-it-works">
                <button className="w-full h-14 rounded-full border border-gray-300 bg-white text-gray-700 font-bold text-sm hover:border-[#066CF4]/40 hover:text-[#066CF4] active:scale-[0.99] transition-all cursor-pointer">
                  How It Works
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <LocationPrompt
        isOpen={showLocationPrompt}
        onClose={() => {
          setLocationError(null);
          setShowLocationPrompt(false);
        }}
        error={locationError}
        onAllowLocation={async () => {
          const result = await location.requestLocation();
          if (result.ok) {
            setLocationError(null);
            setShowLocationPrompt(false);
          } else {
            setLocationError(result.message);
          }
        }}
        onSearchLocation={async (query) => {
          const ok = await location.setManualLocation(query);
          if (ok) {
            setLocationError(null);
            setShowLocationPrompt(false);
          } else {
            setLocationError('Could not find that location. Please try another area.');
          }
        }}
        isLoading={location.isLoading}
      />
    </section>
  );
}
