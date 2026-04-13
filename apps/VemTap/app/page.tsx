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
import ProfileMyBusinessCTA from '@/components/landing/ProfileMyBusinessCTA';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vemtap',
  description: 'VemTap is a digital engagement platform designed for businesses to instantly capture customer information through a simple "tap" using NFC (Near Field Communication) or QR codes. It is primarily used to replace manual data entry and paper forms, allowing businesses to collect visitor details in under two seconds',
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
      {/* <Team /> */}
      <MarketplaceCTA />
      <Pricing />
      <MobileExperience />
      {/* <Testimonials /> */}
      <ContactSection />
      <AutomationCTA />
      <ProfileMyBusinessCTA />
      <FAQ />
      <Footer />
    </div>
  );
}

