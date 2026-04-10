'use client';

import React from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { motion } from 'framer-motion';
import { 
    Zap, 
    QrCode, 
    Users, 
    BarChart3, 
    Smartphone, 
    Target, 
    ArrowRight, 
    CheckCircle2,
    ShieldCheck,
    Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SYNERGY_POINTS = [
    {
        title: "Dynamic QR Intelligence",
        desc: "Convert physical traffic into digital leads with QRThrive's high-conversion dynamic codes.",
        icon: QrCode,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Customer Data Mastery",
        desc: "Manage and nurture those leads into loyal customers using Vemtap's robust CRM tools.",
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        title: "Full-Loop Analytics",
        desc: "Track everything from the first scan in QRThrive to the final conversion in Vemtap.",
        icon: BarChart3,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    }
];

const FEATURES = [
    { 
        name: "Instant Scan Tracking", 
        desc: "Know exactly who scans your codes and when they do it.",
        from: "QRThrive", 
        to: "Vemtap" 
    },
    { 
        name: "Dynamic Updates", 
        desc: "Change your website links anytime without re-printing your QR codes.",
        from: "QRThrive", 
        to: "Vemtap" 
    },
    { 
        name: "Auto-Lead Capture", 
        desc: "Automatically save customer info the moment they scan your asset.",
        from: "Vemtap", 
        to: "QRThrive" 
    },
    { 
        name: "Perfect Design Match", 
        desc: "A smooth, matching look from the first scan to the final signup.",
        from: "Both", 
        to: "Shared" 
    },
];

export default function ExploreQRThrivePage() {
    return (
        <div className="p-4 lg:p-10 max-w-7xl mx-auto space-y-16 pb-20">
            <PageHeader 
                title="Explore QRThrive" 
                description="The ultimate power-up for your physical-to-digital business ecosystem."
            />

            {/* Hero Section */}
            <section className="relative group overflow-hidden rounded-[3rem] bg-slate-900 min-h-[500px] flex items-center">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="/qrthrive_vemtap_integration.png" 
                        alt="Synergy" 
                        className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
                </div>

                <div className="relative z-10 p-8 lg:p-20 max-w-2xl space-y-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-widest"
                    >
                        <Zap size={14} className="fill-blue-400" />
                        Next-Gen Integration
                    </motion.div>
                    
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-none"
                    >
                        Bridging Physical <br />
                        <span className="text-blue-400">to Digital.</span>
                    </motion.h2>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-300 font-medium leading-relaxed"
                    >
                        Vemtap handles your data, QRThrive drives your traffic. Together, they create a closed-loop system that transforms every scan into a measurable business outcome.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <a 
                            href="https://test.qrthrive.com" 
                            target="_blank" 
                            className="inline-flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                        >
                            Visit QRThrive Platform
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Synergy Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SYNERGY_POINTS.map((point, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", point.bg, point.color)}>
                            <point.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-3">{point.title}</h3>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">{point.desc}</p>
                    </motion.div>
                ))}
            </section>

            {/* In-Depth Explanation */}
            <section className="bg-slate-50 rounded-[3rem] p-8 lg:p-16 border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-3xl lg:text-4xl font-black text-text-main tracking-tight leading-none">
                                How they work <br /> 
                                <span className="text-primary italic">hand-in-hand.</span>
                            </h3>
                            <p className="text-lg text-text-secondary font-medium">
                                Think of QRThrive as your **Frontline Scout** and Vemtap as your **Command Center**.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Target size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main">Lead Capture (QRThrive)</h4>
                                    <p className="text-xs text-text-secondary font-medium">Generate branded QR codes that link directly to your Vemtap capture pages.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main">Data Retention (Vemtap)</h4>
                                    <p className="text-xs text-text-secondary font-medium">Once scanned, Vemtap takes over to manage profiles, loyalty, and communication.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex-shrink-0 size-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main">Universal Reach</h4>
                                    <p className="text-xs text-text-secondary font-medium">Deploy QR codes globally and track performance centrally in real-time.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px] -z-10" />
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 space-y-8">
                            <h4 className="text-center font-black text-text-main uppercase tracking-widest text-xs">Feature Synergy Matrix</h4>
                            <div className="space-y-4">
                                {FEATURES.map((feature, i) => (
                                    <div key={i} className="group p-5 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-xl hover:border-blue-100 border border-transparent transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="size-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                                                    <CheckCircle2 size={14} />
                                                </div>
                                                <span className="text-sm font-black text-text-main uppercase tracking-tight">{feature.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded">{feature.from}</span>
                                                <ArrowRight size={10} className="text-slate-300" />
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-black uppercase rounded">{feature.to}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-text-secondary font-medium pl-9 italic group-hover:text-text-main transition-colors">
                                            {feature.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary text-white p-12 lg:p-20 rounded-[4rem] text-center space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full -translate-x-32 translate-y-32 blur-3xl" />
                
                <h3 className="text-4xl lg:text-5xl font-black tracking-tight relative z-10">Start Your Full-Circle Growth.</h3>
                <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto relative z-10">
                    Ready to take your business to the next level? Head over to QRThrive and start generating dynamic assets today.
                </p>
                <div className="pt-4 relative z-10">
                    <a 
                        href="https://test.qrthrive.com" 
                        target="_blank" 
                        className="inline-flex items-center gap-4 px-12 py-6 bg-white text-primary rounded-[2rem] font-black uppercase tracking-widest text-lg hover:scale-105 transition-all shadow-2xl active:scale-95"
                    >
                        Launch QRThrive
                        <ArrowRight size={24} />
                    </a>
                </div>
            </section>
        </div>
    );
}
