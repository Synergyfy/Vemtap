'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ArrowRight, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';
import LocationPrompt from './LocationPrompt';
import DiscoveryEcosystem from './DiscoveryEcosystem';
import BusinessPulse from './BusinessPulse';
import DealsConstellation from './DealsConstellation';
import type { HomeLocation } from './types';

interface HeroCarouselProps {
  location: HomeLocation | null;
  onLocationSet: (loc: HomeLocation) => void;
}

export default function HeroCarousel({ location, onLocationSet }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Gentle autoplay — pause when user interacts
  useEffect(() => {
    if (!emblaApi) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      timer = setInterval(() => {
        if (emblaApi.canScrollNext()) emblaApi.scrollNext();
        else emblaApi.scrollTo(0);
      }, 7000);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
    };
    start();
    emblaApi.on('pointerDown', stop);
    emblaApi.on('pointerUp', start);
    return () => {
      stop();
      emblaApi.off('pointerDown', stop);
      emblaApi.off('pointerUp', start);
    };
  }, [emblaApi]);

  return (
    <section className="relative overflow-hidden pt-6 pb-10 sm:pt-10 sm:pb-14">
      <div className="absolute inset-0 bg-gradient-to-b from-[#066CF4]/[0.06] via-white to-white pointer-events-none" />
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-[#066CF4]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 size-56 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />

      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {/* Slide 1 — Consumer default */}
            <div className="min-w-0 flex-[0_0_100%]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[480px] lg:min-h-[500px]">
                <div className="order-2 lg:order-1 text-center lg:text-left">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-[#066CF4]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#066CF4] mb-4">
                    Discover near you
                  </p>
                  <h1 className="text-[28px] sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-3">
                    Discover What&apos;s Near You
                  </h1>
                  <p className="text-base sm:text-lg text-gray-500 mb-6 max-w-md mx-auto lg:mx-0 leading-relaxed">
                    Find amazing deals, businesses, products and services around you.
                  </p>
                  <SearchBar className="mb-4 text-left" />
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start">
                    <LocationPrompt location={location} onLocationSet={onLocationSet} className="w-full sm:w-auto" />
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <DiscoveryEcosystem />
                </div>
              </div>
            </div>

            {/* Slide 2 — Business */}
            <div className="min-w-0 flex-[0_0_100%]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:min-h-[460px]">
                <div className="order-2 lg:order-1 text-center lg:text-left">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-4">
                    For businesses
                  </p>
                  <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-3">
                    Get Your Business Discovered
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                    Put your business, products and offers in front of people looking for what you offer.
                  </p>
                  <Link
                    href="/get-started"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#066CF4] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all"
                  >
                    Get Started as a Business
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="order-1 lg:order-2 flex items-center justify-center">
                  <BusinessPulse />
                </div>
              </div>
            </div>

            {/* Slide 3 — Consumer explore */}
            <div className="min-w-0 flex-[0_0_100%]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center lg:min-h-[460px]">
                <div className="order-2 lg:order-1 text-center lg:text-left">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-4">
                    Always something new
                  </p>
                  <h2 className="text-[28px] sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-3">
                    There&apos;s Always Something to Discover
                  </h2>
                  <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                    Explore new deals, businesses, products and offers around you.
                  </p>
                  <Link
                    href="/deals"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#066CF4] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all"
                  >
                    Explore VEMTAP
                    <Compass size={16} />
                  </Link>
                </div>
                <div className="order-1 lg:order-2 flex items-center justify-center">
                  <DealsConstellation />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="mt-8 flex items-center justify-center gap-2" role="tablist" aria-label="Hero slides">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={selected === i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                selected === i ? 'w-6 bg-[#066CF4]' : 'w-2 bg-gray-300 hover:bg-gray-400'
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
