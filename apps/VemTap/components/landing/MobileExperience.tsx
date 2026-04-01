import React from 'react';
import Link from 'next/link';
import { Zap, User, Phone, Mail, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';

export default function MobileExperience() {
    return (
        <section id="mobile" className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="lg:w-1/2 flex justify-center order-2 lg:order-1 relative">
                        <div className="relative group">
                            {/* Ambient Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/20 rounded-full blur-[100px] -z-10 opacity-30 animate-pulse group-hover:bg-primary/30 transition-colors"></div>
                            
                            {/* Smartphone Mockup */}
                            <div className="w-[280px] xs:w-[320px] h-[580px] xs:h-[640px] bg-slate-950 rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative border-8 border-slate-900 overflow-hidden transform hover:rotate-1 transition-transform duration-700">
                                {/* Notch */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-900 rounded-b-[1.5rem] z-20"></div>
                                
                                {/* Screen Content */}
                                <div className="w-full h-full bg-white rounded-[2.8rem] overflow-hidden flex flex-col font-sans">
                                    <div className="bg-primary/5 p-8 pt-12 text-center border-b border-gray-100/50">
                                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-primary/30">
                                            <Zap size={28} className="text-white fill-white" />
                                        </div>
                                        <h4 className="font-display font-black text-gray-900 tracking-tight">Welcome to VemTap</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Instant Registration</p>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        {[
                                            { label: 'Full Name', icon: <User size={16} />, placeholder: 'John Doe' },
                                            { label: 'Phone Number', icon: <Phone size={16} />, placeholder: '+234 800 000 0000' },
                                            { label: 'Email Address', icon: <Mail size={16} />, placeholder: 'john@example.com' },
                                        ].map((f, i) => (
                                            <div key={i} className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">{f.label}</label>
                                                <div className="h-12 bg-gray-50/50 border border-gray-100 rounded-2xl px-4 flex items-center gap-4 group/input transition-all focus-within:border-primary/30 focus-within:bg-white focus-within:shadow-sm">
                                                    <div className="text-gray-300 group-focus-within/input:text-primary transition-colors">
                                                        {f.icon}
                                                    </div>
                                                    <div className="h-2 w-28 bg-gray-100 rounded-full animate-pulse group-focus-within/input:animate-none group-focus-within/input:bg-gray-50 transition-all"></div>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 mt-6 active:scale-95 hover:bg-primary-hover transition-all duration-300 shadow-primary/40">
                                            Join Now
                                        </button>
                                        <p className="text-[9px] text-center text-gray-400 font-medium">Safe & Secure Infrastructure</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 order-1 lg:order-2 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
                            <Smartphone size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                Easy Experience
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main leading-[1.1] tracking-tight mb-8">
                            Make it easy for <br className="hidden sm:block" /> <span className="text-primary">your customers</span>
                        </h2>
                        <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-12 font-medium max-w-xl">
                            Your customers just tap their phone. No app needed, no logins required. It works fast and helps you get their data in under 2 seconds.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-10 mb-14">
                            <div className="flex flex-col gap-5 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                    <Zap size={22} className="fill-current" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main text-lg mb-2 tracking-tight font-display">Connects Instantly</h4>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium">Works fast on any network. No waiting, no friction.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-5 group">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <ShieldCheck size={22} className="fill-current" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-text-main text-lg mb-2 tracking-tight font-display">Safe & Secure</h4>
                                    <p className="text-sm text-text-secondary leading-relaxed font-medium">Enterprise-grade security for your customer data.</p>
                                </div>
                            </div>
                        </div>

                        <Link href="/features#mobile" className="inline-flex items-center gap-3 font-black text-[10px] uppercase tracking-widest text-text-main group hover:text-primary transition-colors">
                            Explore Mobile Features
                            <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
