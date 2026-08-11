'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { designPresets as presets } from '@/styles/presets';

const allTestimonials = [
    {
        id: 1,
        metric: '8X',
        metricLabel: 'Conversion Boost',
        quote: "LaTap's NFC integration for our physical events was a game changer. We collected 8 times more leads than our previous paper-based system.",
        author: "David Callahan",
        role: "Head of Marketing, Jara",
        avatar: "https://i.pravatar.cc/150?u=1",
        category: "Enterprise"
    },
    {
        id: 2,
        metric: '45%',
        metricLabel: 'ROI Increase',
        quote: "The ease of use for customers is unparalleled. Just a tap and they're in. This level of friction-free engagement is exactly what our retail stores needed.",
        author: "Sarah Mitchel",
        role: "Customer Success",
        avatar: "https://i.pravatar.cc/150?u=2",
        category: "Retail"
    },
    {
        id: 3,
        metric: '3.2k',
        metricLabel: 'New Signups',
        quote: "Absolutely stunning design and flawless execution. The dashboard analytics give us insights into foot traffic we never had before.",
        author: "Tom Becker",
        role: "Founder, PulseCore",
        avatar: "https://i.pravatar.cc/150?u=3",
        category: "SaaS"
    },
    {
        id: 4,
        metric: '100%',
        metricLabel: 'Sync Rate',
        quote: "Fastest implementation we've ever done. We had 50 locations live in just under a week. Support was top-notch throughout.",
        author: "Jennifer Wu",
        role: "COO, Flash Retail",
        avatar: "https://i.pravatar.cc/150?u=4",
        category: "Retail"
    },
    {
        id: 5,
        metric: '12ms',
        metricLabel: 'Latency',
        quote: "Technical performance is rock solid. We haven't seen a single dropped connection. The handshake is instantaneous across all devices.",
        author: "Alex Rivera",
        role: "CTO, TechFlow",
        avatar: "https://i.pravatar.cc/150?u=8",
        category: "Tech"
    },
    {
        id: 6,
        metric: '5.0',
        metricLabel: 'User Rating',
        quote: "Our gym members love the digital check-in. It's modern, hygienic, and incredibly fast. Our staff can focus on training now.",
        author: "Marcus Iron",
        role: "Owner, Iron Roots Gym",
        avatar: "https://i.pravatar.cc/150?u=5",
        category: "Fitness"
    }
];

export default function TestimonialsPage() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400; // card width + gap
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            <Navbar />

            <main className="pt-48 pb-32">
                <div className={presets.containerMaxWidth}>
                    {/* Header */}
                    <div className="max-w-3xl mb-24">
                        <span className={presets.badge}>Customer Stories</span>
                        <h1 className={presets.title}>Trusted by innovators worldwide</h1>
                        <h2 className={`${presets.subtitle} mt-2`}>Real results from real teams</h2>
                        <p className={`${presets.body} mt-6`}>
                            Discover how businesses are transforming physical interactions into digital growth using LaTap's NFC technology.
                        </p>
                    </div>

                    {/* Carousel Section */}
                    <div className="mb-24">
                        <div className="flex items-center justify-between mb-8">
                            <p className="text-xs font-bold uppercase tracking-wider text-text-main">Featured Success Stories</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => scroll('left')}
                                    className="size-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-text-main hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <span className="material-icons-round text-sm">chevron_left</span>
                                </button>
                                <button
                                    onClick={() => scroll('right')}
                                    className="size-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-text-main hover:bg-gray-50 transition-all active:scale-95"
                                >
                                    <span className="material-icons-round text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        <div
                            className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            ref={scrollRef}
                        >
                            {allTestimonials.map((t, i) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="min-w-[340px] md:min-w-[400px] snap-start"
                                >
                                    <div className={`${presets.card} p-8 h-full`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="size-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                                                <span className="material-icons-round text-xl">format_quote</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-display font-bold text-text-main leading-none">{t.metric}</p>
                                                <p className="text-[8px] font-bold uppercase tracking-wider text-text-secondary mt-1">{t.metricLabel}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-text-main font-medium leading-relaxed mb-8">
                                            "{t.quote}"
                                        </p>
                                        <div className="flex items-center gap-4 mt-auto">
                                            <img src={t.avatar} className="size-9 rounded-full grayscale" />
                                            <div>
                                                <p className="font-bold text-xs text-text-main">{t.author}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">{t.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Grid for categories */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allTestimonials.map((t, i) => (
                            <div key={t.id} className={`${presets.card} p-6 border-transparent bg-white/50 backdrop-blur-sm`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[8px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{t.category}</span>
                                </div>
                                <p className="text-xs text-text-secondary font-medium leading-relaxed mb-6 line-clamp-3">
                                    "{t.quote}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <img src={t.avatar} className="size-7 rounded-full" />
                                    <div>
                                        <p className="font-bold text-[10px] text-text-main">{t.author}</p>
                                        <p className="text-[8px] font-bold text-text-secondary truncate max-w-[120px]">{t.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Final CTA */}
                    <div className="mt-32 p-12 md:p-20 rounded-2xl bg-text-main text-white text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 size-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-10 tracking-tight">Ready to start your story?</h2>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href="/get-started" className={presets.buttonPrimary}>
                                    Get Started Free
                                </Link>
                                <Link href="/solutions" className="px-10 py-3.5 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-all">
                                    Browse Solutions
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
