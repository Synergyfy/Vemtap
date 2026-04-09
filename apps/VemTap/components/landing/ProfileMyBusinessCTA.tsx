import React from 'react';
import Link from 'next/link';
import { Target, ArrowRight, Building2, Store, Briefcase } from 'lucide-react';

export default function ProfileMyBusinessCTA() {
    return (
        <section className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-8">
                <div className="bg-text-main rounded-[3.5rem] p-8 md:p-16 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Background Detail */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3"></div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
                            <Target size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                Optimize Your Experience
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-8">
                            Discover the right <br className="hidden sm:block" /> <span className="text-primary">tools for your business</span>
                        </h2>
                        <p className="text-base md:text-lg text-white/70 leading-relaxed mb-12 font-medium max-w-xl mx-auto lg:mx-0">
                            Every sector is different. Profile your business to get tailored strategies, specific solutions, and see exactly how VemTap can grow your organization.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                            <Link href="/profile-my-business" className="px-10 py-5 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 group/btn">
                                Profile My Business
                                <ArrowRight size={18} className="inline ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Visual Mockups */}
                    <div className="relative w-full lg:w-1/2 flex justify-center py-10 z-10">
                        <div className="relative w-full max-w-md">
                            {/* Card 1 */}
                            <div className="absolute -top-12 -left-8 md:-left-12 w-48 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 transform -rotate-6 shadow-2xl animate-pulse" style={{ animationDuration: '4s' }}>
                                <div className="size-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
                                    <Store size={24} />
                                </div>
                                <h4 className="text-white font-bold mb-1">Retail</h4>
                                <p className="text-white/50 text-xs">Foot traffic analysis</p>
                            </div>
                            
                            {/* Card 2 */}
                            <div className="bg-white rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10 transform hover:scale-105 transition-transform duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-16 rounded-2xl bg-text-main flex items-center justify-center text-white">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">AI Guided</div>
                                        <h3 className="text-xl font-bold text-text-main">Custom Strategy</h3>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-3/4"></div>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-1/2"></div>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-5/6"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="absolute -bottom-10 -right-4 w-56 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-6 transform rotate-3 shadow-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}>
                                <div className="size-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 mb-4">
                                    <Briefcase size={24} />
                                </div>
                                <h4 className="text-white font-bold mb-1">Services</h4>
                                <p className="text-white/50 text-xs">Lead generation optimized</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
