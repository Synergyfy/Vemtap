import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import ProfileMyBusinessCTA from '@/components/landing/ProfileMyBusinessCTA';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Features',
    description: 'Explore the powerful features of VemTap: from digital lead capture and CRM integration to real-time analytics and NFC-driven automation.',
};

export default function FeaturesPage() {
    const features = [
        {
            title: 'Digital Lead Capture',
            desc: 'Automatically collect names, emails, and contact details the moment a customer taps. No manual entry, no errors.',
            icon: 'person_add',
            highlight: 'Lead Gen'
        },
        {
            title: 'Dynamic Redirection',
            desc: 'Route customers to different links based on time of day, location, or visitor frequency. Perfect for menus, reviews, or bookings.',
            icon: 'shortcut',
            highlight: 'Smart Links'
        },
        {
            title: 'CRM Integration',
            desc: 'Sync your captured data directly with HubSpot, Salesforce, or Mailchimp. Turn walk-ins into mailing list subscribers instantly.',
            icon: 'hub',
            highlight: 'Automation'
        },
        {
            title: 'Real-time Analytics',
            desc: 'Track every tap, scan conversion rates, and identify peak business hours with our centralized dashboard.',
            icon: 'insights',
            highlight: 'Data'
        },
        {
            title: 'Multi-Location Fleet',
            desc: 'Manage thousands of NFC tags across different venues from a single account. Update all your redirects in one click.',
            icon: 'layers',
            highlight: 'Fleet'
        },
        {
            title: 'Enterprise Security',
            desc: 'GDPR and CCPA compliant data handling. End-to-end encryption for every visitor interaction.',
            icon: 'admin_panel_settings',
            highlight: 'Secure'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-40 pb-24">
                <section className="px-4 sm:px-6 lg:px-8 text-center mb-24">
                    <div className="max-w-4xl mx-auto">
                        <span className="text-primary font-bold tracking-widest text-xs uppercase mb-4 block">Capabilities</span>
                        <h1 className="text-5xl md:text-7xl font-display font-bold text-text-main mb-8 leading-tight">
                            Built for <span className="text-gradient">Modern Scale</span>
                        </h1>
                        <p className="text-xl text-text-secondary font-medium leading-relaxed max-w-2xl mx-auto">
                            Powerful tools to manage your physical-to-digital bridge. Simple enough for a cafe, powerful enough for a global stadium.
                        </p>
                    </div>
                </section>

                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="group p-10 rounded-[2.5rem] bg-gray-50 border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-2xl transition-all duration-500">
                            <div className="flex justify-between items-start mb-10">
                                <div className="size-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-6">
                                    <span className="material-icons-round text-3xl">{f.icon}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">{f.highlight}</span>
                            </div>
                            <h3 className="text-2xl font-bold font-display text-text-main mb-4">{f.title}</h3>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </section>

                {/* Integration Spotlight */}
                <section className="mt-32 py-24 bg-text-main text-white overflow-hidden relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl text-center md:text-left">
                            <h2 className="text-4xl font-display font-bold mb-6">Connect to your favorite tools.</h2>
                            <p className="text-lg opacity-70 mb-8">
                                VemTap integrates seamlessly with over 5,000+ apps via Zapier and direct webhooks. Automate your workflow the second a customer taps.
                            </p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <Link href="/get-started" className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full transition-all">
                                    Start Integrating
                                </Link>
                            </div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="grid grid-cols-3 gap-4">
                                {['hubspot', 'mailchimp', 'salesforce', 'slack', 'shopify', 'google_drive'].map((icon, i) => (
                                    <div key={i} className="size-20 md:size-24 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer group">
                                        <span className="material-icons-round text-3xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">api</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-32 text-center">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-4xl md:text-6xl font-display font-bold text-text-main mb-8 leading-tight">Ready to unlock these <br />features for your business?</h2>
                        <Link href="/get-started" className="inline-block bg-primary text-white font-bold px-12 py-5 rounded-full text-xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                            Get Started for Free
                        </Link>
                    </div>
                </section>

                {/* Profile My Business CTA */}
                <ProfileMyBusinessCTA />
            </main>

            <Footer />
        </div>
    );
}
