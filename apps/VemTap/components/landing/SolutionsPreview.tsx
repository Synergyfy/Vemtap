import React from 'react';
import Link from 'next/link';
import { ArrowRight, Smartphone, LayoutDashboard, MonitorSmartphone, Cpu } from 'lucide-react';

export default function SolutionsPreview() {
    return (
        <section className="py-12 md:py-20 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10">
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                        <MonitorSmartphone size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Our Ecosystem
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main leading-tight mb-8 tracking-tight">
                        Complete Offline-to-Online <span className="text-primary">Solution</span>
                    </h2>
                    <p className="text-base md:text-xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed">
                        We provide both the physical touchpoints and the digital brain to power your customer loyalty.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
                    {/* Hardware Card - Clean Light Theme */}
                    <div className="group relative min-h-[460px] rounded-[3rem] bg-white p-10 md:p-14 flex flex-col justify-between transition-all duration-700 hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden">
                        {/* Abstract background detail */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.02] rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/5 transition-colors" />
                        
                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:shadow-primary/20">
                                <Cpu size={32} strokeWidth={1.5} />
                            </div>

                            <div>
                                <h3 className="text-4xl lg:text-5xl font-display font-black text-text-main leading-[0.9] mb-6 tracking-tight">
                                    Enterprise <br /> <span className="text-primary">Hardware</span>
                                </h3>
                                <p className="text-text-secondary text-sm md:text-base font-bold uppercase tracking-widest opacity-40 mb-2">Build Quality</p>
                                <p className="text-text-secondary text-lg font-medium leading-relaxed max-w-[260px]">
                                    Industrial-grade NFC plates & cards. Waterproof, durable, and instantly ready.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                            <Link href="/solutions/hardware" className="inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-text-main group-hover:text-primary transition-colors">
                                Marketplace
                                <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link href="/solutions/hardware" className="size-16 md:size-20 rounded-full bg-text-main text-white flex items-center justify-center hover:bg-black hover:scale-110 transition-all shadow-2xl shadow-black/20 group-hover:-rotate-12">
                                <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                            </Link>
                        </div>
                    </div>

                    {/* Software Card - Premium Dark Theme */}
                    <div className="group relative min-h-[460px] rounded-[3rem] bg-gray-900 p-10 md:p-14 flex flex-col justify-between transition-all duration-700 hover:shadow-2xl border border-gray-800 overflow-hidden">
                        {/* Interactive background detail */}
                        <div className="absolute top-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                            <LayoutDashboard size={240} strokeWidth={0.5} className="text-white transform rotate-12 -mr-20 -mt-20 flex-shrink-0" />
                        </div>

                        <div className="relative z-10 flex flex-col gap-8">
                            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-white group-hover:bg-primary transition-all duration-500 shadow-inner group-hover:scale-110 group-hover:shadow-primary/40">
                                <MonitorSmartphone size={32} strokeWidth={1.5} />
                            </div>

                            <div>
                                <h3 className="text-4xl lg:text-5xl font-display font-black text-white leading-[0.9] mb-6 tracking-tight">
                                    Merchant <br /> <span className="text-primary">Software</span>
                                </h3>
                                <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-2">Automated Insights</p>
                                <p className="text-white/70 text-lg font-medium leading-relaxed max-w-[260px]">
                                    Cloud dashboard to track visits, automate rewards, and engage customers.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center justify-between">
                            <Link href="/solutions/software" className="inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                                Dashboard Feature
                                <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                            </Link>

                            <Link href="/solutions/software" className="size-16 md:size-20 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover hover:scale-110 transition-all shadow-2xl shadow-primary/30 group-hover:rotate-12">
                                <ArrowRight className="w-6 h-6 md:w-8 md:h-8" />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
