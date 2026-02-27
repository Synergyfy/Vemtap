import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/landing/Hero';
import SpeedComparison from '@/components/landing/SpeedComparison';
import SolutionsPreview from '@/components/landing/SolutionsPreview';
import Process from '@/components/landing/Process';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import MobileExperience from '@/components/landing/MobileExperience';
import AutomationCTA from '@/components/landing/AutomationCTA';
import Testimonials from '@/components/landing/Testimonials';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/layout/Footer';
import Team from '@/components/landing/Team';
import MarketplaceCTA from '@/components/landing/MarketplaceCTA';
import ContactSection from '@/components/landing/ContactSection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visitor Engagement Management',
  description: 'The all-in-one NFC platform for modern businesses. Capture data, engage customers, and drive loyalty with a single tap.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <SpeedComparison />
      <Process />
      <Features />
      <SolutionsPreview />
      <Team />
      <MarketplaceCTA />
      <Pricing />
      <MobileExperience />
      <Testimonials />
      <ContactSection />
      <AutomationCTA />
      <FAQ />
      <Footer />
    </div>
  );
}
