"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
    QrCode, MapPin, Smartphone, UserCheck, 
    Database, MessageSquare, Zap, ArrowRight, 
    Play, CheckCircle2, ChevronRight, Smartphone as Smartphone2,
    Check
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const steps = [
    { 
        title: 'Generate QR', 
        desc: 'Access your dashboard to create custom, branded QR codes for your specific business locations.',
        icon: QrCode,
        color: 'text-blue-600',
        bg: 'bg-blue-50'
    },
    { 
        title: 'Place QR', 
        desc: 'Position your codes at checkout counters, tables, or entry doors where customers naturally interact.',
        icon: MapPin,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
    },
    { 
        title: 'Customer Scans', 
        desc: 'Visitors scan the code using their smartphone camera. No apps or downloads required.',
        icon: Smartphone,
        color: 'text-purple-600',
        bg: 'bg-purple-50'
    },
    { 
        title: 'Customer Registers', 
        desc: 'A beautiful, mobile-optimized form appears. Customers join your database in seconds.',
        icon: UserCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50'
    },
    { 
        title: 'Data Captured', 
        desc: 'Visitor information is instantly synced to your dashboard, building your list automatically.',
        icon: Database,
        color: 'text-rose-600',
        bg: 'bg-rose-50'
    },
    { 
        title: 'Follow Up', 
        desc: 'Send automated rewards, announcements, or offers via WhatsApp and SMS to drive repeat visits.',
        icon: MessageSquare,
        color: 'text-amber-600',
        bg: 'bg-amber-50'
    },
];

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <main className="pt-32 pb-24 px-6">
                {/* HERO SECTION */}
                <section className="container mx-auto max-w-6xl text-center mb-32">
                    <Badge className="bg-blue-50 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                        The Vemtap Journey
                    </Badge>
                    <h1 className="text-4xl md:text-7xl font-black text-gray-900 leading-tight mb-8">
                        See How Vemtap <br /> <span className="text-[#066CF4]">Helps You Grow</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto mb-12">
                        Transform your physical business into a digital growth engine in 6 simple steps.
                    </p>
                    <div className="flex justify-center">
                        <Link href="/get-started">
                            <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                                Start Free
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* STEPS TIMELINE */}
                <section className="container mx-auto max-w-5xl mb-32">
                    <div className="relative space-y-12">
                        {steps.map((step, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="group flex flex-col md:flex-row items-center gap-8 md:gap-16 p-8 md:p-12 rounded-[48px] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500"
                            >
                                <div className={cn("size-24 md:size-32 rounded-[32px] flex items-center justify-center shrink-0 shadow-sm transition-all group-hover:scale-110", step.bg, step.color)}>
                                    <step.icon size={48} />
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                                        <span className="text-xs font-black text-[#066CF4] uppercase tracking-widest">Step 0{index + 1}</span>
                                        <div className="h-px w-8 bg-blue-100" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">{step.title}</h3>
                                    <p className="text-lg text-gray-500 font-medium leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                                {index < 5 && (
                                    <div className="hidden lg:flex absolute left-[64px] bottom-[-60px] h-[60px] w-0.5 bg-gradient-to-b from-blue-100 to-transparent" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* INTERACTIVE FLOW DIAGRAM (TIMELINE) */}
                <section className="container mx-auto max-w-4xl py-20 px-6 bg-gray-50 rounded-[60px] border border-gray-100 relative overflow-hidden">
                   <div className="text-center mb-16 relative z-10">
                      <h2 className="text-3xl font-black text-gray-900">Seamless Integration Flow</h2>
                      <p className="text-sm font-medium text-gray-400 mt-2 uppercase tracking-widest">Physical to Digital</p>
                   </div>
                   
                   <div className="max-w-xs mx-auto relative z-10">
                      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-blue-100" />
                      
                      {[
                        { t: 'Business Dashboard', d: 'Setup and generate QR.', active: true },
                        { t: 'Physical Space', d: 'QR/NFC Deployment.', active: true },
                        { t: 'Customer Device', d: 'Scan and Registration.', active: true },
                        { t: 'Vemtap Cloud', d: 'Data sync and processing.', active: true },
                        { t: 'Marketing Engine', d: 'Automated follow-ups.', active: true },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-8 mb-12 last:mb-0 relative">
                           <div className={cn(
                             "size-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 z-10",
                             item.active ? "bg-[#066CF4]" : "bg-gray-200"
                           )}>
                              <Check size={16} className="text-white" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900">{item.t}</p>
                              <p className="text-xs font-medium text-gray-400">{item.d}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                {/* FINAL CTA SECTION */}
                <section className="container mx-auto max-w-4xl text-center py-32">
                    <div className="size-20 rounded-[28px] bg-[#066CF4] text-white flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/30">
                        <Zap size={40} fill="white" />
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">Ready To Build <br /> Your Database?</h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/get-started">
                            <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                                Start Free
                            </Button>
                        </Link>
                        <button className="flex items-center gap-3 px-8 py-4 text-gray-900 font-black uppercase tracking-widest text-xs hover:text-[#066CF4] transition-colors">
                            <div className="size-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#066CF4]">
                                <Play size={16} fill="currentColor" />
                            </div>
                            Watch Demo
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
