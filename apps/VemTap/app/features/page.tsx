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

const badgeClass = 'bg-[#066CF4]/10 text-[#066CF4] border-none px-3.5 py-1.5 font-bold uppercase tracking-wider';
const primaryBtn = 'h-12 px-8 rounded-xl bg-[#066CF4] text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all';

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
            
            <main className="pt-24 md:pt-32 pb-20 px-6">
                {/* HERO SECTION */}
                <section className="container mx-auto max-w-4xl text-center mb-20">
                    <Badge className={badgeClass + " mb-5"}>
                        Platform Capabilities
                    </Badge>
                    <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] mb-6 tracking-tight">
                        Everything You Need To <br /> Capture, Engage & <span className="text-[#066CF4]">Retain</span>
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-gray-500 font-normal max-w-2xl mx-auto mb-9">
                        Vemtap provides the complete toolkit to turn your physical space into a digital growth engine.
                    </p>
                    <Link href="/get-started">
                        <Button className={primaryBtn}>
                            Start Free
                        </Button>
                    </Link>
                </section>

                {/* FEATURES GRID */}
                <section className="container mx-auto max-w-6xl mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featureCategories.map((category, index) => (
                            <motion.div 
                                key={index}
                                whileHover={{ y: -6 }}
                                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col"
                            >
                                <div className={cn("size-12 rounded-xl flex items-center justify-center mb-5", category.bg, category.color)}>
                                    <category.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2.5">{category.title}</h3>
                                <p className="text-sm font-normal text-gray-500 leading-relaxed mb-6">
                                    {category.description}
                                </p>
                                <ul className="space-y-2.5 mb-7 flex-1">
                                    {category.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-2.5 text-[13px] font-normal text-gray-700">
                                            <div className="size-5 rounded-full bg-blue-50 text-[#066CF4] flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button variant="ghost" className="justify-start px-0 text-xs font-bold uppercase tracking-wider text-[#066CF4] hover:bg-transparent hover:text-blue-700">
                                    Learn More <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* DEEP DIVE SECTION */}
                <section className="container mx-auto max-w-6xl mb-20 bg-gray-900 rounded-[36px] md:rounded-[60px] p-8 md:p-16 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[50%] h-full bg-[#066CF4]/10 rounded-full blur-[120px]" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                        <div>
                           <Badge className="bg-[#066CF4] text-white border-none px-3.5 py-1.5 font-bold uppercase tracking-wider mb-5">
                             Enterprise Grade
                           </Badge>
                           <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                             Scalable Solutions For <br /> Every Stage Of Growth
                           </h2>
                           <p className="text-base font-normal text-white/60 mb-8">
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
                                   <p className="font-bold text-sm mb-1">{i.t}</p>
                                   <p className="text-[13px] text-white/40 font-normal">{i.d}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-square bg-[#066CF4] rounded-full flex items-center justify-center p-8 shadow-[0_0_80px_rgba(6,108,244,0.3)]">
                                <Zap size={72} className="text-white fill-white" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA SECTION */}
                <section className="container mx-auto max-w-4xl text-center py-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">Start Growing Your <br /> Business Today</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/get-started">
                            <Button className={primaryBtn}>
                                Start Free
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-all">
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