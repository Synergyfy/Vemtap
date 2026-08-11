'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Pricing from '@/components/landing/Pricing';
import {
    Terminal, LayoutDashboard, MessageSquare, BarChart3,
    ShieldCheck, ArrowRight, UserCheck, Smartphone,
    Trophy, Sparkles, Filter, Zap, CheckCircle2,
    Briefcase, Settings, Database
} from 'lucide-react';

export default function SoftwareSolutionPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-text-main">
            <Navbar />

            <main className="relative">
                {/* HERO SECTION */}
                <section className="relative pt-48 pb-24 overflow-hidden bg-white min-h-[85vh] flex flex-col items-center border-b border-gray-50">
                    {/* Ambient Gradients */}
                    <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Fading Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
                        backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'linear-gradient(to right, black 20%, transparent 80%)',
                    }}></div>

                    <div className="container mx-auto px-4 text-center z-10 relative">
                        <h1 className="font-bold text-[30px] sm:text-4xl md:text-5xl leading-[1.15] text-text-main max-w-5xl mx-auto mb-8 tracking-tight">
                            The Intelligence <br />
                            <span className="text-gradient">Control Center</span>
                        </h1>

                        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
                            Turn physical foot traffic into actionable digital data. Our merchant dashboard provides the tools to measure, manage, and grow your customer base with automated precision.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Link href="/get-started" className="bg-primary hover:bg-primary-hover text-white font-bold px-12 py-5 rounded-full transition-all transform hover:scale-105 shadow-xl shadow-primary/25 text-sm uppercase tracking-wider cursor-pointer flex items-center gap-3">
                                Start Your Trial
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/features" className="flex items-center gap-2 bg-white text-text-main font-bold px-12 py-5 rounded-full border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer text-sm uppercase tracking-wider">
                                Watch Software Demo
                            </Link>
                        </div>

                        {/* Software Visualization */}
                        <div className="relative max-w-5xl mx-auto group perspective-[2000px]">
                            <div className="absolute -inset-1 bg-linear-to-r from-purple-500/30 to-primary/30 rounded-[3rem] blur opacity-20 animate-pulse"></div>
                            <div className="relative bg-white rounded-4xl shadow-2xl border border-gray-100 p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full bg-gray-50/50 -z-10 -rotate-1 translate-y-12"></div>

                                <div className="flex-1 space-y-8 text-left">
                                    <div className="size-16 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                                        <LayoutDashboard size={32} />
                                    </div>
                                    <h3 className="text-3xl font-display font-bold">The Unified Dashboard</h3>
                                    <p className="text-text-secondary font-medium leading-relaxed">
                                        A centralized command center where you can monitor visitor flow, manage loyalty tiers, and launch precision marketing broadcasts across your entire hardware network.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                                            <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Live Metrics</span>
                                        </div>
                                        <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                                            <div className="size-2 bg-primary rounded-full"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Cloud Sync</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 relative group">
                                    <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-800">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                            <div className="flex gap-1.5">
                                                <div className="size-2.5 rounded-full bg-red-500/50"></div>
                                                <div className="size-2.5 rounded-full bg-yellow-500/50"></div>
                                                <div className="size-2.5 rounded-full bg-green-500/50"></div>
                                            </div>
                                            <div className="h-4 w-32 bg-gray-800 rounded-full"></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-24 bg-gray-800/50 rounded-xl p-4 space-y-3">
                                                <div className="h-2 w-12 bg-primary/50 rounded"></div>
                                                <div className="h-4 w-16 bg-white/10 rounded"></div>
                                            </div>
                                            <div className="h-24 bg-gray-800/50 rounded-xl p-4 space-y-3">
                                                <div className="h-2 w-12 bg-blue-500/50 rounded"></div>
                                                <div className="h-4 w-20 bg-white/10 rounded"></div>
                                            </div>
                                        </div>
                                        <div className="h-32 bg-primary/10 border border-primary/20 rounded-xl p-6 flex items-center justify-center">
                                            <BarChart3 className="text-primary w-12 h-12 opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CORE PILLARS SECTION */}
                <section className="py-32 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                            <div className="order-2 lg:order-1 relative">
                                <div className="absolute -inset-10 bg-primary/5 blur-[100px] -z-10"></div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-white border border-gray-100 rounded-4xl shadow-xl hover:shadow-2xl transition-all space-y-4 translate-y-8">
                                        <div className="size-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                            <MessageSquare size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Auto-Retention</h4>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed">Smart SMS and email triggers that bring customers back when they reach specific visit milestones.</p>
                                    </div>
                                    <div className="p-8 bg-white border border-gray-100 rounded-4xl shadow-xl hover:shadow-2xl transition-all space-y-4">
                                        <div className="size-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                                            <UserCheck size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">CRM Intelligence</h4>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed">Build rich profiles including visit frequency, average spend, and personal preferences automatically.</p>
                                    </div>
                                    <div className="p-8 bg-white border border-gray-100 rounded-4xl shadow-xl hover:shadow-2xl transition-all space-y-4 translate-y-8">
                                        <div className="size-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                            <Trophy size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Loyalty Logic</h4>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed">Customize your own "Tap-to-Earn" rules and reward structures with ease from the central panel.</p>
                                    </div>
                                    <div className="p-8 bg-white border border-gray-100 rounded-4xl shadow-xl hover:shadow-2xl transition-all space-y-4">
                                        <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                            <Database size={24} />
                                        </div>
                                        <h4 className="font-bold text-lg">Open API</h4>
                                        <p className="text-xs text-text-secondary font-medium leading-relaxed">Sync your physical visitor data with your existing POS, Shopify, or custom ERP systems effortlessly.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="order-1 lg:order-2 space-y-8">
                                <span className="text-primary font-bold uppercase tracking-wider text-[10px]">Merchant Infrastructure</span>
                                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15]">Software that closes <br /> the physical-digital gap.</h2>
                                <p className="text-lg text-text-secondary font-medium leading-relaxed">
                                    Traditionally, physical businesses lose touch with their customers the moment they walk out the door. We change that. Our software ensures that every physical visit creates a persistent digital bridge.
                                </p>
                                <ul className="space-y-6">
                                    {[
                                        'Instant user identification without app downloads',
                                        'Proprietary "First-Tap" capture technology',
                                        'Automated GDPR-compliant data collection',
                                        'Real-time behavioral heatmaps for staff'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-4 text-sm font-bold text-text-main">
                                            <div className="size-6 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ANALYTICS PREVIEW SECTION */}
                <section className="py-32 px-4 bg-gray-50 border-y border-gray-100">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-10">
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">Decisions driven by <br /> pure visitor data.</h2>
                            <p className="text-lg text-text-secondary font-medium leading-relaxed">
                                Stop guessing your peak hours or your most loyal segments. Our platform visualizes your physical traffic with the granularity of a digital storefront.
                            </p>
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div>
                                    <p className="text-3xl font-display font-bold text-primary">₦0</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Capture Cost</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-display font-bold text-primary">100%</p>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Data Ownership</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <BarChart3 size={200} />
                            </div>
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center">
                                    <h5 className="font-bold text-lg">Returning User Rate</h5>
                                    <span className="text-emerald-500 font-bold text-sm">+24% vs last week</span>
                                </div>
                                <div className="h-48 flex items-end justify-between gap-3">
                                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                                        <div key={i} className="flex-1 bg-primary/10 rounded-t-xl relative group">
                                            <div
                                                className="absolute bottom-0 w-full bg-primary rounded-t-xl transition-all duration-700"
                                                style={{ height: `${h}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Pricing />

                {/* FINAL CALL TO ACTION */}
                <section className="py-48 px-4 bg-white text-center">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="size-24 bg-primary/10 text-primary rounded-4xl flex items-center justify-center mx-auto mb-8">
                            <Sparkles size={48} />
                        </div>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight">Ready to activate your space?</h2>
                        <p className="text-xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
                            Join over 500+ businesses who have transformed their offline environment into a digital growth engine. No credit card required to start.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link href="/get-started" className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-bold px-16 py-6 rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-primary/30 text-sm uppercase tracking-wider cursor-pointer">
                                Create Founder Account
                            </Link>
                            <Link href="/support" className="w-full sm:w-auto bg-white text-text-main font-bold px-16 py-6 rounded-2xl border border-gray-200 hover:border-text-main transition-all cursor-pointer text-sm uppercase tracking-wider">
                                Contact Enterprise Sales
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div >
    );
}
