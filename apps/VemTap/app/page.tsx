'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroCarousel from '@/components/home/HeroCarousel';
import FeaturedDeals from '@/components/home/FeaturedDeals';
import AroundYou from '@/components/home/AroundYou';
import CategoriesRail from '@/components/home/CategoriesRail';
import type { HomeLocation } from '@/components/home/types';

const RecommendedBusinesses = dynamic(
  () => import('@/components/home/RecommendedBusinesses'),
  { ssr: false }
);
const MoreDeals = dynamic(() => import('@/components/home/MoreDeals'), { ssr: false });
const HowItWorksMini = dynamic(() => import('@/components/home/HowItWorksMini'));
const QrNetworkSection = dynamic(() => import('@/components/home/QrNetworkSection'));
const BusinessCta = dynamic(() => import('@/components/home/BusinessCta'));
const ConsumerCta = dynamic(() => import('@/components/home/ConsumerCta'));

const LOCATION_KEY = 'vemtap_user_location';
const LOCATION_LABEL_KEY = 'vemtap_user_location_label';

function readStoredLocation(): HomeLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number };
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        label: localStorage.getItem(LOCATION_LABEL_KEY) || undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function Homepage() {
  const [location, setLocation] = useState<HomeLocation | null>(null);

  useEffect(() => {
    setLocation(readStoredLocation());
  }, []);

  const onLocationSet = useCallback((loc: HomeLocation) => {
    setLocation(loc);
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat: loc.lat, lng: loc.lng }));
      if (loc.label) localStorage.setItem(LOCATION_LABEL_KEY, loc.label);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <HeroCarousel location={location} onLocationSet={onLocationSet} />
        <FeaturedDeals />
        <AroundYou location={location} onLocationSet={onLocationSet} />
        <CategoriesRail />
        <RecommendedBusinesses />
        <MoreDeals />
        <HowItWorksMini />
        <QrNetworkSection />
        <BusinessCta />
        <ConsumerCta />
      </main>
      <Footer />
    </div>
  );
}
