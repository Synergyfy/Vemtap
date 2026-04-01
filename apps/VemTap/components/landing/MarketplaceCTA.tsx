'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Package, Shield, Zap, Nfc, CreditCard, Scan } from 'lucide-react';

export default function MarketplaceCTA() {
    return (
        <section className="py-12 md:py-20 bg-white overflow-hidden relative">
            {/* Ambient background decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-primary/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                    {/* Left Content */}
                    <div className="text-left order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
                            <ShoppingBag size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                Hardware Marketplace
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-8 text-text-main leading-[1.1] tracking-tight">
                            Power your business with <span className="text-primary">Smart Hardware</span>
                        </h2>
                        <p className="text-base md:text-lg text-text-secondary font-medium mb-10 leading-relaxed max-w-xl">
                            Browse our curated selection of enterprise-grade NFC readers, smart cards, and access control hardware.
                            Tested, certified, and ready for instant integration.
                        </p>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                            {[
                                { icon: <Package className="text-primary" size={24} />, title: 'Premium Quality', desc: 'Industrial built' },
                                { icon: <Shield className="text-primary" size={24} />, title: 'Certified', desc: 'Global standards' },
                                { icon: <Zap className="text-primary" size={24} />, title: 'Fast Delivery', desc: 'Nigeria-wide' }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-start group">
                                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors group-hover:text-white group-hover:scale-110 duration-300">
                                        {item.icon}
                                    </div>
                                    <h4 className="font-bold text-text-main text-sm mb-1">{item.title}</h4>
                                    <p className="text-xs text-text-secondary font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-5">
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/25 group/btn"
                            >
                                Browse Store
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/marketplace#bulk-orders"
                                className="inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-white border-2 border-gray-100 text-text-main text-sm font-black uppercase tracking-widest rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm"
                            >
                                Bulk Orders
                            </Link>
                        </div>
                    </div>

                    {/* Right Visual - Interactive Card Grid */}
                    <div className="relative order-1 lg:order-2">
                        <div className="grid grid-cols-2 gap-4 md:gap-6">
                            {/* Product Cards */}
                            <div className="space-y-4 md:space-y-6">
                                <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group">
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Nfc size={48} className="text-primary transform group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-text-main">NFC Reader Pro</h4>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">₦45,000</p>
                                    </div>
                                </div>
                                <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group translate-y-4 md:translate-y-8">
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <CreditCard size={48} className="text-primary transform group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-text-main">Smart Cards</h4>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">₦25,000</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 md:space-y-6 pt-8 md:pt-16">
                                <div className="bg-white p-5 md:p-6 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group">
                                    <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-5 flex items-center justify-center overflow-hidden relative">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Scan size={48} className="text-primary transform group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-sm text-text-main">Wall Terminal</h4>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">₦85,000</p>
                                    </div>
                                </div>
                                <div className="bg-primary p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-primary/20 flex flex-col items-center justify-center text-center text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                                    <ShoppingBag size={32} className="mb-4 text-white/90" />
                                    <p className="text-base font-bold leading-tight mb-1">100+</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">More Items</p>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div className="absolute -top-6 -right-2 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-gray-100 z-20 animate-bounce-slow">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Free Shipping</p>
                            <p className="text-[9px] text-text-secondary font-bold mt-0.5">Across Nigeria</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
