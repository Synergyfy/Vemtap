'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
    ArrowRight,
    Radio,
    Globe,
    HardDrive,
    Cog,
    ShieldAlert,
    CheckCircle2,
    Smartphone
} from 'lucide-react';
import LogoIcon from '@/components/brand/LogoIcon';


export default function HardwareSolutionPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-text-main">
            <Navbar />

            <main className="relative">
                {/* HERO SECTION - Mirroring Landing Page Hero */}
                <section className="relative pt-48 pb-24 overflow-hidden bg-white min-h-[85vh] flex flex-col items-center border-b border-gray-50">
                    {/* Ambient Gradients - Match Landing Page */}
                    <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Decorative Fading Grid Lines - Match Landing Page */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to right, black 20%, transparent 80%)',
                        WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 80%)'
                    }}></div>

                    <div className="container mx-auto px-8 md:px-16 lg:px-20 max-w-6xl text-center z-10 relative">
                        <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-text-main max-w-4xl mx-auto mb-10 tracking-tight">
                            The bridge between physical <br />
                            <span className="text-gradient">touchpoints & digital loyalty.</span>
                        </h1>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                            <Link href="/marketplace" className="bg-primary hover:bg-primary-hover text-white font-bold px-10 py-4 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-primary/25 text-sm uppercase tracking-widest cursor-pointer flex items-center gap-3">
                                Explore NFC Catalog
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/get-started" className="flex items-center gap-2 bg-white text-text-main font-bold px-10 py-4 rounded-full border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer text-sm uppercase tracking-widest">
                                Request Custom Design
                            </Link>
                        </div>

                        {/* Hardware Visualization Mockup */}
                        <div className="relative max-w-4xl mx-auto group perspective-[2000px]">
                            <div className="absolute -inset-1 bg-linear-to-r from-primary/30 to-blue-300/30 rounded-[2.5rem] blur opacity-20 animate-pulse"></div>
                            <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 md:p-12 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-gray-50/50 -z-10 rotate-12 translate-x-12"></div>

                                <div className="flex-1 space-y-8 text-left">
                                    <div className="size-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20">
                                        <LogoIcon size={32} />
                                    </div>
                                    <h3 className="text-3xl font-display font-bold">The Signature NFC Plate</h3>
                                    <p className="text-text-secondary font-medium leading-relaxed">
                                        Precision-molded from specialized high-density PVC and coated with a scratch-resistant finish. Embedded with NXP® NTAG213 microchips for banking-grade reliability.
                                    </p>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Response Time</p>
                                            <p className="text-xl font-bold font-display">84ms</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Durability</p>
                                            <p className="text-xl font-bold font-display">IP67 Waterproof</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 relative group">
                                    <div className="aspect-square bg-linear-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] p-10 flex flex-col justify-end transform hover:rotate-3 transition-all duration-700 shadow-2xl">
                                        <div className="absolute top-10 right-10 text-white/10 group-hover:text-primary transition-colors duration-500">
                                            <LogoIcon size={120} />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="h-6 w-32 bg-white/10 rounded-full animate-pulse"></div>
                                            <div className="h-4 w-24 bg-white/5 rounded-full"></div>
                                            <div className="pt-8 flex justify-between items-center">
                                                <p className="text-white text-sm font-bold tracking-widest">TAP TO IDENTIFY</p>
                                                <div className="size-8 rounded-full border border-white/20 flex items-center justify-center">
                                                    <Smartphone size={16} className="text-white/40" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE SCIENCE SECTION - High Performance Info */}
                <section className="py-32 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                            <div className="space-y-12 sticky top-32">
                                <div className="space-y-6">
                                    <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px]">Technical Specifications</span>
                                    <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight">How our NFC bridge operates.</h2>
                                    <p className="text-lg text-text-secondary font-medium leading-relaxed">
                                        We don't just sell smart stickers,metal plates,identity cards; we provide a high-performance communication layer. Our hardware is engineered to work in high-traffic environments, ensuring that every tap results in a successful merchant-customer handshake.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="size-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <Radio size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Proximity Induction</h4>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Operates at 13.56 MHz, utilizing the phone's electromagnetic field to power data transfer instantly.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="size-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <HardDrive size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Anti-Collision Logic</h4>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Advanced chip logic allows for identification even when multiple tags are in close proximity.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="size-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <Globe size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Universal Standard</h4>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Fully compliant with ISO/IEC 14443 Type A, compatible with 99.8% of modern mobile hardware.</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="size-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Signature Lock</h4>
                                        <p className="text-sm text-text-secondary font-medium leading-relaxed">Every hardware piece is locked with a unique merchant signature, preventing unauthorized tag hijacking.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <div className="bg-gray-50 rounded-[3rem] p-12 border border-gray-100">
                                    <h3 className="text-2xl font-display font-bold mb-8 flex items-center gap-3">
                                        <Cog className="text-primary" />
                                        Engineering Detail
                                    </h3>
                                    <div className="space-y-8">
                                        {[
                                            { label: 'Chipset', value: 'NXP NTAG213 / NTAG215 (High Frequency)' },
                                            { label: 'Memory', value: '144 - 504 Bytes User R/W' },
                                            { label: 'Material', value: 'Impact-Resistant PMMA / Stainless Steel' },
                                            { label: 'Working Temp', value: '-25°C to +70°C' },
                                            { label: 'Read Distance', value: 'Up to 4cm (Device Dependent)' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">{item.label}</span>
                                                <span className="text-sm font-bold text-text-main">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-10 bg-primary/5 border border-primary/10 rounded-[2.5rem]">
                                    <p className="text-text-main font-bold text-lg mb-4">Did you know?</p>
                                    <p className="text-sm text-text-secondary font-medium leading-relaxed">
                                        NFC identification is 4x faster than QR code scanning. It eliminates the need for camera focus, lighting adjustments, and app interaction, making it the perfect solution for busy store-fronts and clubs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* THE CATALOG EXPLORER - Grid Content */}
                <section className="py-32 px-4 bg-gray-50 border-y border-gray-100">
                    <div className="max-w-7xl mx-auto space-y-20">
                        <div className="text-center max-w-3xl mx-auto space-y-6">
                            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Built for every venue type.</h2>
                            <p className="text-lg text-text-secondary font-medium">Modular hardware designed to blend into your aesthetic while standing out in utility.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    heading: 'Merchant Plates',
                                    desc: 'Fixed identification point for receptionists, bars, and exit halls. Durable and professional.',
                                    img: "/assets/nfc/Reading position.avif",
                                    tags: ['Self-Adhesive', 'Branded', 'Industrial PVC'],
                                    color: 'bg-blue-600'
                                },
                                {
                                    heading: 'Identity Cards',
                                    desc: 'Credit-card sized NFC tags for staff or VIP priority members. Fits in any wallet.',
                                    img: "/assets/nfc/Card NFC Plate White Spec branded.avif",
                                    tags: ['Double-Sided', 'Durable', 'Personalized'],
                                    color: 'bg-purple-600'
                                },
                                {
                                    heading: 'Smart Stickers',
                                    desc: 'Low-profile tags for menus, table tents, and product packaging. Flexible and discrete.',
                                    img: "/assets/nfc/Chip_tag_NFC215.avif",
                                    tags: ['Flexible', 'Discrete', 'Clear Gloss'],
                                    color: 'bg-emerald-600'
                                }
                            ].map((item, i) => (
                                <div key={i} className="group flex flex-col h-full rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                                    <div className="h-64 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/10 z-10 group-hover:bg-transparent transition-colors"></div>
                                        <img src={item.img} alt={item.heading} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                    <div className={`flex-1 p-10 ${item.color} flex flex-col text-white`}>
                                        <div className="mb-auto">
                                            <h3 className="text-2xl md:text-3xl font-bold font-display leading-[1.1] mb-4">
                                                {item.heading}
                                            </h3>
                                            <p className="text-white/80 font-medium leading-relaxed mb-8 text-sm">
                                                {item.desc}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {item.tags.map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white/90 rounded-lg border border-white/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* RELIABILITY SECTION - Enterprise Content */}
                <section className="py-48 px-4 bg-white overflow-hidden relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/2 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-10 relative z-10">
                            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight leading-tight">Reliability that <br /> merchants trust.</h2>
                            <p className="text-lg text-text-secondary font-medium leading-relaxed">
                                Our hardware isn't just about the first tap. It's about ensuring the 10,000th visitor has the same seamless experience as the first one.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: 'Anti-Tear Lamination', desc: 'Protects the internal antenna from physical strain and bending.' },
                                    { title: 'Zero Battery Waste', desc: 'Hardware runs entirely on proximity induction. No charging required.' },
                                    { title: 'Heat Resistance', desc: 'Tested in Nigerian temperatures up to 45°C without data corruption.' }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="size-6 bg-primary text-white rounded-lg flex items-center justify-center shrink-0 mt-1">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-lg">{item.title}</h5>
                                            <p className="text-sm text-text-secondary font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-[80px] -z-10 group-hover:bg-primary/10 transition-colors"></div>
                            <div className="bg-white border border-gray-100 p-8 rounded-[3.5rem] shadow-2xl space-y-8">
                                <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">System Pulse Check</p>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm font-bold text-text-main">Signal Integrity</p>
                                                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Passive HF induction</p>
                                            </div>
                                            <p className="text-2xl font-display font-bold text-emerald-500">99.9%</p>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[99.9%]"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-6 pt-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-sm font-bold text-text-main">Packet Loss</p>
                                                <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Encrypted Handshake</p>
                                            </div>
                                            <p className="text-2xl font-display font-bold text-primary">0.02%</p>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary w-[2%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center p-4">
                                    <p className="text-sm text-text-secondary font-medium">Monitoring active hardware signatures...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CALL TO ACTION */}
                <section className="py-24 px-4 bg-white">
                    <div className="max-w-7xl mx-auto container">
                        <Link href="/marketplace" className="block relative rounded-[3rem] overflow-hidden shadow-2xl group transition-transform duration-500 hover:scale-[1.02]">
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors z-10 pointer-events-none"></div>
                            <img
                                src="/assets/nfc_cta_banner.png"
                                alt="Buy NFC Tags"
                                className="w-full h-auto object-cover"
                            />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
