import React from 'react';
import Link from 'next/link';
import { Sparkles, ChevronDown, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export default function AutomationCTA() {
    return (
        <section className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-8">
                <div className="bg-primary/5 rounded-[3.5rem] p-8 md:p-16 lg:p-24 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    {/* Visual Mockups */}
                    <div className="relative w-full lg:w-1/2 order-2 lg:order-1 flex justify-center py-10">
                        {/* Main Table Card */}
                        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden transform -rotate-2 z-10 transition-all hover:rotate-0 duration-700 group">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white">
                                <h3 className="font-bold text-text-main text-sm font-display tracking-tight">Recent Interactions</h3>
                                <div className="text-[10px] bg-gray-50 px-3 py-1.5 rounded-full text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 border border-gray-100">
                                    Action <ChevronDown size={12} />
                                </div>
                            </div>
                            <div className="text-[10px] w-full">
                                <div className="bg-primary text-white p-4 grid grid-cols-6 gap-2 font-black uppercase tracking-[0.2em] shadow-sm">
                                    <div className="col-span-2">Customer</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2 text-right">Status</div>
                                </div>
                                {[
                                    { name: 'Alex Rivera', cat: 'Event Tap', status: 'Active', active: true },
                                    { name: 'Sarah Chen', cat: 'Loyalty Tap', status: 'Pending', active: false },
                                    { name: 'Marcus Bell', cat: 'Shop Visit', status: 'Active', active: true },
                                    { name: 'Elena Diaz', cat: 'Smart Card', status: 'Pending', active: false },
                                ].map((row, i) => (
                                    <div key={i} className={`px-6 py-5 grid grid-cols-6 gap-2 border-b border-gray-50 items-center justify-between ${row.active ? 'bg-green-50/20' : 'text-gray-400 opacity-60'}`}>
                                        <div className="col-span-2 flex items-center gap-3 font-bold text-text-main">
                                            <div className={`size-2 rounded-full ${row.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`}></div>
                                            {row.name}
                                        </div>
                                        <div className="col-span-2 font-bold opacity-80">{row.cat}</div>
                                        <div className="col-span-2 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${row.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Rule Card */}
                        <div className="absolute top-0 right-0 md:-right-4 w-64 bg-white rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] z-20 border border-gray-100 transform rotate-3 p-8 transition-all hover:rotate-0 hover:scale-105 duration-700 hidden sm:block">
                            <div className="flex items-center justify-between mb-8">
                                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <Sparkles size={20} className="fill-current" />
                                </div>
                                <div className="size-3 rounded-full bg-green-500 animate-pulse"></div>
                            </div>
                            <h4 className="font-black text-text-main mb-6 text-[10px] uppercase tracking-[0.2em] font-display opacity-40">Automation Workflow</h4>
                            <div className="space-y-4">
                                {[
                                    { text: 'Assign VIP Tag', done: true },
                                    { text: 'Send SMS Pack', done: true },
                                    { text: 'Notify Admin', done: false }
                                ].map((step, i) => (
                                    <div key={i} className={`flex items-center justify-between text-[11px] font-bold ${step.done ? 'text-text-main' : 'text-gray-300'}`}>
                                        <span>{step.text}</span>
                                        {step.done ? <CheckCircle2 size={16} className="text-primary" /> : <Circle size={16} className="text-gray-200" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full lg:w-1/2 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                Smart Automation
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-text-main leading-[1.1] tracking-tight mb-8">
                            Save time with <br className="hidden sm:block" /> <span className="text-primary">Automated Follow-ups</span>
                        </h2>
                        <p className="text-base md:text-lg text-text-secondary leading-relaxed mb-12 font-medium max-w-xl mx-auto lg:mx-0">
                            Don't waste time on repetitive tasks. Let VemTap handle your guest engagement so you can focus on growing your business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                            <Link href="/get-started" className="px-10 py-5 rounded-2xl bg-primary text-white text-sm font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 group/btn">
                                Start automation
                                <ArrowRight size={18} className="inline ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/login" className="px-10 py-5 rounded-2xl border-2 border-gray-100 text-text-main text-sm font-black uppercase tracking-widest hover:border-primary hover:text-primary transition-all text-center">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
