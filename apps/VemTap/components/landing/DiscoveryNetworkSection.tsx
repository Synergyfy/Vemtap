'use client';

import React from 'react';
import { Globe, Users, Zap, Search, Building2, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DiscoveryNetworkSection() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
                            <Globe size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                The Vemtap Network
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-6">
                            Be Discovered By New Customers Automatically
                        </h2>
                        <p className="text-lg text-text-secondary font-medium mb-8 leading-relaxed">
                            Every business on Vemtap becomes part of our local discovery network. When customers use Vemtap at one location, they can easily find and engage with other great businesses like yours.
                        </p>
                        
                        <div className="space-y-6 mb-10">
                            {[
                                { title: 'Increased Visibility', desc: 'Appear in local searches and category-based recommendations.', icon: Search },
                                { title: 'Cross-Promotion', desc: 'Reach customers who are already engaging with businesses in your area.', icon: Users },
                                { title: 'Viral Growth', desc: 'Our smart algorithm suggests your business to the right people at the right time.', icon: Zap },
                            ].map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary shrink-0">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-1">{item.title}</h4>
                                        <p className="text-xs text-text-secondary font-medium opacity-70">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Link href="/get-started" className="inline-flex items-center gap-2 bg-primary text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                            Learn More About Discovery
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="relative z-10 p-4 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-sm">
                            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 aspect-square flex items-center justify-center p-12">
                                <div className="relative w-full h-full">
                                    {/* Central Business Hub */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 bg-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-primary/40 z-20">
                                        <Building2 size={32} />
                                    </div>
                                    
                                    {/* Orbiting Businesses */}
                                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ 
                                                rotate: [0, 360],
                                            }}
                                            transition={{ 
                                                duration: 20 + i * 2, 
                                                repeat: Infinity, 
                                                ease: "linear" 
                                            }}
                                            className="absolute top-1/2 left-1/2 w-full h-full"
                                            style={{ rotate: `${angle}deg` }}
                                        >
                                            <div 
                                                className="absolute top-0 left-1/2 -translate-x-1/2 size-14 bg-white rounded-2xl shadow-lg border border-gray-50 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-colors"
                                                style={{ rotate: `-${angle}deg` }}
                                            >
                                                <Store size={20} />
                                            </div>
                                        </motion.div>
                                    ))}
                                    
                                    {/* Connection Lines */}
                                    <div className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-full"></div>
                                    <div className="absolute inset-[25%] border-2 border-dashed border-gray-50 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Notification */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 z-20 animate-bounce">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                    <Users size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary opacity-40 leading-none mb-1">New Referral</p>
                                    <p className="text-xs font-black text-text-main">+12 Customers today</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
