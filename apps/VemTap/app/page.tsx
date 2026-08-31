'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HomeHero from '@/components/home/HomeHero';
import FeaturedDeals from '@/components/home/FeaturedDeals';
import YouMayLike from '@/components/home/YouMayLike';
import NewOnVemtap from '@/components/home/NewOnVemtap';
import PopularNow from '@/components/home/PopularNow';
import CategoryRail from '@/components/home/CategoryRail';
import AroundYouSection from '@/components/home/AroundYouSection';
import HowItWorksSimple from '@/components/home/HowItWorksSimple';
import QRNetworkSection from '@/components/home/QrNetworkSection';
import BusinessCTA from '@/components/home/BusinessCta';
import ConsumerCTA from '@/components/home/ConsumerCta';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main>
        <HomeHero />
        
        <FeaturedDeals />
        
        <YouMayLike />
        
        <NewOnVemtap />
        
        <PopularNow />
        
        <CategoryRail />
        
        <AroundYouSection />
        
        <HowItWorksSimple />
        
        <QRNetworkSection />
        
        <BusinessCTA />
        
        <ConsumerCTA />
      </main>

      <Footer />
    </div>
  );
}
