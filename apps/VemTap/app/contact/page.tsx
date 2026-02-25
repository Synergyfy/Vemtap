import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContactSection from '@/components/landing/ContactSection';

export const metadata: Metadata = {
    title: 'Contact Us | VemTap',
    description: 'Call or visit VemTap for support, sales, and onboarding assistance.',
};

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <ContactSection isPage />
            <Footer />
        </div>
    );
}
