import Link from 'next/link';
import React from 'react';
import { LayoutDashboard, Users, BarChart3, Settings, LifeBuoy, Circle, Zap, CheckCircle2 } from 'lucide-react';

export default function Hero() {
    return (
        <section className="relative pt-24 md:pt-32 pb-20 md:pb-32 overflow-hidden bg-white min-h-screen flex flex-col items-center">
            {/* Ambient Gradients */}
            <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            {/* Decorative Fading Grid Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                maskImage: 'linear-gradient(to right, black 20%, transparent 80%)',
                WebkitMaskImage: 'linear-gradient(to right, black 20%, transparent 80%)'
            }}></div>

            <div className="container mx-auto px-6 md:px-16 lg:px-20 max-w-7xl z-10 relative">
                {/* Top Section: Split Layout (Text & Video) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
                    {/* Left Column: Content */}
                    <div className="text-left space-y-8 animate-in fade-in slide-in-from-left-32 duration-1000">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
                            <Zap size={14} className="text-primary fill-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                The Future of Customer Loyalty
                            </span>
                        </div>
                        <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-text-main tracking-tight">
                            Turn Every Visitor Into A <span className="text-primary">Customer You Can Reach Again</span>
                        </h1>

                        <p className="text-base md:text-xl text-text-secondary max-w-xl font-medium leading-relaxed">
                            Capture customer details using QR codes and NFC technology. Build your customer database, send smart messages, and grow your business.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                            <Link href="/get-started" className="w-full sm:w-auto text-center bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-xs px-10 py-5 rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-primary/30 cursor-pointer">
                                Get Started
                            </Link>
                            <Link href="/demo" className="w-full sm:w-auto text-center bg-white border-2 border-primary/10 hover:border-primary/30 text-primary font-black uppercase tracking-widest text-xs px-10 py-5 rounded-2xl transition-all transform hover:scale-105 shadow-xl shadow-gray-200/50 cursor-pointer">
                                Watch Demo
                            </Link>
                        </div>
                    </div>

                    {/* Right Column: Video Showcase */}
                    <div className="relative animate-in fade-in slide-in-from-right-32 duration-1000 delay-200 flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-[280px] p-2 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 shadow-sm group">
                            <div className="relative aspect-9/16 bg-gray-950 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-gray-900 group-hover:border-primary/20 transition-colors duration-500">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
                                >
                                    <source src="/assets/videos/hero.webm" type="video/webm" />
                                </video>
                                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                            </div>

                            {/* Trust Badge - Small & Visible on all devices now */}
                            <div className="absolute -bottom-6 -right-2 md:-right-6 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-2xl border border-gray-100 z-20 transform rotate-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-40 leading-none mb-1">Success Rate</p>
                                        <p className="text-lg font-black text-text-main tracking-tight">99.9% Reliable</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Dashboard Mockup */}
                <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 overflow-hidden px-2 md:px-0">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-blue-400/20 rounded-[3rem] blur-3xl opacity-20 animate-pulse"></div>
                        <div className="relative bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100">
                            {/* Browser Header */}
                            <div className="bg-gray-50/80 border-b border-gray-100 px-8 py-5 flex items-center gap-4">
                                <div className="flex gap-2">
                                    <div className="size-2.5 rounded-full bg-red-400/60 shadow-sm"></div>
                                    <div className="size-2.5 rounded-full bg-yellow-400/60 shadow-sm"></div>
                                    <div className="size-2.5 rounded-full bg-green-400/60 shadow-sm"></div>
                                </div>
                                <div className="bg-white px-6 py-1.5 rounded-full text-[9px] text-gray-400 font-black flex-1 text-center max-w-[320px] mx-auto border border-gray-100 uppercase tracking-widest shadow-sm">
                                    app.vemtap.io/dashboard
                                </div>
                            </div>

                            <div className="grid grid-cols-12 min-h-[500px]">
                                {/* Sidebar Mockup */}
                                <div className="col-span-3 bg-gray-50/30 border-r border-gray-100 p-8 hidden lg:block">
                                    <div className="flex items-center gap-4 mb-12">
                                        <div className="size-11 rounded-2xl bg-primary flex items-center justify-center text-white text-xs font-black shadow-xl shadow-primary/30">VT</div>
                                        <div className="font-display font-black text-text-main text-base tracking-tight">VemTap AI</div>
                                    </div>
                                    <div className="space-y-4 text-left">
                                        <div className="flex items-center gap-4 px-5 py-3 text-primary bg-primary/5 rounded-2xl text-xs font-black uppercase tracking-widest border border-primary/5">
                                            <LayoutDashboard size={18} /> Dashboard
                                        </div>
                                        {[
                                            { l: 'Customers', i: <Users size={16} /> },
                                            { l: 'Insights', i: <BarChart3 size={16} /> },
                                            { l: 'Marketplace', i: <Zap size={16} /> },
                                            { l: 'Settings', i: <Settings size={16} /> },
                                            { l: 'Help Desk', i: <LifeBuoy size={16} /> }
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 px-5 py-3 text-text-secondary hover:bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer opacity-40 hover:opacity-100 group">
                                                <div className="group-hover:text-primary transition-colors">{item.i}</div>
                                                {item.l}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Content Mockup */}
                                <div className="col-span-12 lg:col-span-9 p-6 md:p-14 text-left bg-linear-to-b from-white to-gray-50/30">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                                        <div>
                                            <h3 className="text-3xl font-display font-black text-text-main tracking-tight leading-none">Visitor Insights</h3>
                                            <p className="text-xs text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-40">Real-time engagement activity</p>
                                        </div>
                                        <div className="bg-green-50 px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-green-100 shadow-sm">
                                            <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Tracking</span>
                                        </div>
                                    </div>

                                    {/* Stats Interior */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
                                        {[
                                            { l: 'Scans', v: '2,845', c: '+12%', up: true },
                                            { l: 'Retention', v: '64.2%', c: '+5.4%', up: true },
                                            { l: 'Revenue', v: '₦1.2M', c: '+2.1%', up: true }
                                        ].map((s, i) => (
                                            <div key={i} className="p-8 rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-200/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-4 opacity-40 group-hover:text-primary transition-colors">{s.l}</p>
                                                <div className="flex items-end justify-between">
                                                    <h4 className="text-3xl font-display font-black text-text-main tracking-tight">{s.v}</h4>
                                                    <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${s.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{s.c}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recent Activity Mini Table */}
                                    <div className="rounded-[2rem] border border-gray-100 overflow-hidden bg-white shadow-2xl shadow-gray-200/30">
                                        <div className="divide-y divide-gray-50">
                                            {[
                                                { n: 'Robert Fox', s: 'NFC Plate 01', t: 'Just now', i: 'RF', bg: 'bg-primary/10', text: 'text-primary' },
                                                { n: 'Sarah Chen', s: 'QR Fallback', t: '5m ago', i: 'SC', bg: 'bg-indigo-50', text: 'text-indigo-600' },
                                                { n: 'Marcus Bell', s: 'NFC Plate 04', t: '12m ago', i: 'MB', bg: 'bg-green-50', text: 'text-green-600' }
                                            ].map((row, i) => (
                                                <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-default">
                                                    <div className="flex items-center gap-5">
                                                        <div className={`size-12 rounded-2xl ${row.bg} ${row.text} flex items-center justify-center text-[11px] font-black shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500`}>{row.i}</div>
                                                        <div className="flex flex-col text-left">
                                                            <div className="text-sm font-black text-text-main leading-tight mb-1">{row.n}</div>
                                                            <div className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-40">{row.s}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-primary transition-colors">{row.t}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
