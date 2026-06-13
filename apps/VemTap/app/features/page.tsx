"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Smartphone, MessageSquare, QrCode, BarChart3, 
    Image as ImageIcon, Globe, CheckCircle2, Zap, 
    ArrowRight, ChevronRight, Layout, Database,
    Layers, Monitor, StickyNote, Smartphone as Smartphone2,
    ShieldCheck, Star, Users, Target
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const featureCategories = [
    {
        title: 'Customer Capture',
        icon: Smartphone,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        description: 'Seamlessly onboard customers at the point of interaction. No apps, no friction—just a simple tap or scan.',
        features: [
            'QR Check-ins',
            'NFC Tap Registration',
            'Lead Collection Forms',
            'Customer Database',
            'Instant Sync'
        ]
    },
    {
        title: 'Smart Messaging',
        icon: MessageSquare,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        description: 'Engage your customers where they are. Automate follow-ups and build relationships with personalized messaging.',
        features: [
            'WhatsApp Campaigns',
            'SMS Promotions',
            'Auto-Announcements',
            'Smart Follow-ups',
            'Behavior Triggers'
        ]
    },
    {
        title: 'QR & NFC Solutions',
        icon: QrCode,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        description: 'Bridge the physical and digital gap with branded NFC plates and dynamic QR codes.',
        features: [
            'Dynamic QR Codes',
            'Static Branding',
            'Custom Design',
            'Multi-format Exports',
            'Print-Ready Files'
        ]
    },
    {
        title: 'Growth Analytics',
        icon: BarChart3,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        description: 'Make data-driven decisions with live insights into visitor behavior and retention.',
        features: [
            'Customer Insights',
            'Visit Tracking',
            'Growth Reports',
            'Campaign ROI',
            'Scan Heatmaps'
        ]
    },
    {
        title: 'Marketing Assets',
        icon: ImageIcon,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        description: 'Professional ready-to-print materials designed to drive customer registration in-store.',
        features: [
            'Poster Templates',
            'Table Tent Designs',
            'Counter Displays',
            'Business Cards',
            'Social Graphics'
        ]
    },
    {
        title: 'Discovery Network',
        icon: Globe,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        description: 'Get discovered by new customers already using Vemtap at nearby local businesses.',
        features: [
            'Business Listings',
            'Local Discovery',
            'Cross-Promotions',
            'Traffic Generation',
            'Referral Engine'
        ]
    }
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <main className="pt-32 pb-24 px-6">
                {/* HERO SECTION */}
                <section className="container mx-auto max-w-6xl text-center mb-32">
                    <Badge className="bg-blue-50 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                        Platform Capabilities
                    </Badge>
                    <h1 className="text-4xl md:text-7xl font-black text-gray-900 leading-tight mb-8">
                        Everything You Need To <br /> Capture, Engage & <span className="text-[#066CF4]">Retain</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-10">
                        Vemtap provides the complete toolkit to turn your physical space into a digital growth engine.
                    </p>
                    <Link href="/get-started">
                        <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                            Start Free
                        </Button>
                    </Link>
                </section>

                {/* FEATURES GRID */}
                <section className="container mx-auto max-w-6xl mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featureCategories.map((category, index) => (
                            <motion.div 
                                key={index}
                                whileHover={{ y: -8 }}
                                className="p-10 rounded-[48px] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col"
                            >
                                <div className={cn("size-16 rounded-[22px] flex items-center justify-center mb-8 shadow-sm", category.bg, category.color)}>
                                    <category.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4">{category.title}</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                                    {category.description}
                                </p>
                                <ul className="space-y-4 mb-10 flex-1">
                                    {category.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-3 text-xs font-bold text-gray-700">
                                            <div className="size-5 rounded-full bg-blue-50 text-[#066CF4] flex items-center justify-center">
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="ghost" className="justify-start px-0 text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:bg-transparent hover:text-blue-700">
                                    Learn More <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* DEEP DIVE SECTION */}
                <section className="container mx-auto max-w-6xl mb-32 bg-gray-900 rounded-[60px] md:rounded-[100px] p-10 md:p-24 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[50%] h-full bg-[#066CF4]/10 rounded-full blur-[120px]" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                        <div>
                           <Badge className="bg-[#066CF4] text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                             Enterprise Grade
                           </Badge>
                           <h2 className="text-3xl md:text-5xl font-black leading-tight mb-8">
                             Scalable Solutions For <br /> Every Stage Of Growth
                           </h2>
                           <p className="text-lg font-medium text-white/60 mb-10">
                             Whether you're a single boutique or a national franchise, Vemtap scales with you. Our infrastructure is built for speed and security.
                           </p>
                           <div className="grid grid-cols-2 gap-6">
                              {[
                                { t: '99.9% Uptime', d: 'Reliable infrastructure.' },
                                { t: 'GDPR Ready', d: 'Data privacy by design.' },
                                { t: 'Global CDN', d: 'Fast loading everywhere.' },
                                { t: 'API Access', d: 'Custom integrations.' }
                              ].map(i => (
                                <div key={i.t}>
                                   <p className="font-black text-sm uppercase tracking-widest mb-1">{i.t}</p>
                                   <p className="text-xs text-white/40">{i.d}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-[#066CF4] rounded-full flex items-center justify-center p-8 shadow-[0_0_80px_rgba(6,108,244,0.3)]">
                                <Zap size={120} className="text-white fill-white" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA SECTION */}
                <section className="container mx-auto max-w-4xl text-center py-20">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">Start Growing Your <br /> Business Today</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/get-started">
                            <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                                Start Free
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="h-16 px-12 rounded-2xl border-gray-100 text-sm font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 transition-all">
                                Contact Sales
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
