'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import HeroSlide from './HeroSlide';
import { useLocation } from '@/hooks/useLocation';
import LocationPrompt from './LocationPrompt';

const SLIDES = [
  { variant: 'consumer' as const },
  { variant: 'business' as const },
  { variant: 'discovery' as const },
];

export default function HomeHero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  const location = useLocation();

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 8000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="relative bg-gradient-to-b from-blue-50/50 to-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

      <div className="relative pt-24 md:pt-28 pb-4">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {SLIDES.map((slide, index) => (
              <div key={slide.variant} className="flex-[0_0_100%] min-w-0">
                <HeroSlide
                  variant={slide.variant}
                  locationLabel={location.label}
                  onLocationClick={() => setShowLocationPrompt(true)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6 pb-6">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === selectedIndex
                  ? 'w-8 h-2 bg-primary'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <LocationPrompt
        isOpen={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
        onAllowLocation={async () => {
          await location.requestLocation();
          setShowLocationPrompt(false);
        }}
        onSearchLocation={async (query) => {
          await location.setManualLocation(query);
          setShowLocationPrompt(false);
        }}
        isLoading={location.isLoading}
      />
    </section>
  );
}
