'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/layout/Footer';

export default function Pricing2Page() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-32 pb-20 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -mt-40" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-6">
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        New Pricing V2
                    </div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-text-main mb-6 tracking-tight leading-tight">
                        Scalable plans for <br /> <span className="text-primary italic">every</span> business size
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto font-medium leading-relaxed">
                        From individual entrepreneurs to global enterprises, VemTap provides the tools you need to digitize your physical space.
                    </p>
                </div>
            </div>

            <Pricing />

            <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Ready to transform your visitor experience?</h2>
                    <p className="text-white/60 text-lg mb-10 font-medium">Join 2,000+ businesses already using VemTap to capture data and build loyalty.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="h-14 px-10 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20">
                            Get Started for Free
                        </button>
                        <button className="h-14 px-10 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
                            Book a Demo
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
