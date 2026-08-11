'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Pricing from '@/components/landing/Pricing';
import Footer from '@/components/layout/Footer';

export default function Pricing2Page() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <div className="pt-24 md:pt-32 pb-16 bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -mt-40" />

                <div className="relative z-10 container mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary mb-5">
                        <span className="material-icons-round text-sm">auto_awesome</span>
                        New Pricing V2
                    </div>
                    <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-5 tracking-tight leading-[1.15]">
                        Scalable plans for <br /> <span className="text-primary italic">every</span> business size
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-text-secondary max-w-2xl mx-auto font-normal leading-relaxed">
                        From individual entrepreneurs to global enterprises, VemTap provides the tools you need to digitize your physical space.
                    </p>
                </div>
            </div>

            <Pricing />

            <section className="py-16 md:py-20 bg-slate-50 text-text-main overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">Ready to transform your visitor experience?</h2>
                    <p className="text-text-secondary text-base md:text-lg lg:text-xl mb-8 font-normal">Join 2,000+ businesses already using VemTap to capture data and build loyalty.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="h-12 px-8 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                            Get Started for Free
                        </button>
                        <button className="h-12 px-8 bg-white text-text-main rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all border border-gray-200">
                            Book a Demo
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}