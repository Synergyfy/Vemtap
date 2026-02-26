'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    MapPin, Phone, Mail, Globe, Clock, Star,
    ChevronRight, Gift, ShieldCheck, Instagram,
    Twitter, Facebook, ExternalLink, Share2, Building2
} from 'lucide-react';
import { useBusinessStore } from '@/store/useBusinessStore';
import { useAuthStore, AuthState } from '../../store/useAuthStore';

export default function BusinessPublicPage() {
    const { slug } = useParams();
    const router = useRouter();
    const { branches } = useBusinessStore();
    const user = useAuthStore((state: AuthState) => state.user);

    // In a real app, we'd fetch business details by slug.
    const businessName = user?.businessName || (slug as string)?.replace(/-/g, ' ') || 'VemTap Business';

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            {/* Hero / Cover */}
            <div className="h-64 bg-linear-to-br from-primary to-indigo-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent scale-150" />
                </div>

                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
                    <button
                        onClick={() => router.back()}
                        className="size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/10"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <button className="size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all border border-white/10">
                        <Share2 size={18} />
                    </button>
                </div>
            </div>

            {/* Profile Info Overlay */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-20">
                <div className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 p-8 md:p-12 border border-white font-sans">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="size-32 rounded-3xl bg-white p-2 shadow-2xl shadow-primary/10 -mt-24 md:-mt-32">
                            <div className="w-full h-full rounded-2xl bg-primary flex items-center justify-center text-white text-4xl font-black">
                                {businessName.charAt(0)}
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                                    {businessName}
                                </h1>
                                <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full" title="Verified Business">
                                    <ShieldCheck size={20} />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold text-sm">
                                <div className="flex items-center gap-1.5 text-orange-500">
                                    <Star size={16} fill="currentColor" />
                                    <span className="font-bold text-slate-900">4.9</span>
                                    <span>(1,240 Reviews)</span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} />
                                    <span>{branches[0]?.address || 'Main Location'}</span>
                                </div>
                            </div>
                        </div>

                        <button className="w-full md:w-auto px-8 h-14 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                            Follow Business
                        </button>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About Side */}
                        <div className="md:col-span-2 space-y-10">
                            <section>
                                <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight">About Us</h2>
                                <p className="text-slate-600 leading-relaxed font-bold">
                                    Welcome to {businessName}! We are dedicated to providing the best experience
                                    to our customers through innovation and quality service. Join our loyalty program
                                    to earn points on every visit and unlock exclusive rewards.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Active Rewards</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { title: 'Free Coffee', icon: '☕', points: 100 },
                                        { title: '15% Discount', icon: '🏷️', points: 250 },
                                    ].map((reward, i) => (
                                        <div key={i} className="group p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-2xl">{reward.icon}</span>
                                                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    {reward.points} Points
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-900 truncate">{reward.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 font-bold">Tap to see details</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Locations & Branches</h2>
                                <div className="space-y-4">
                                    {branches.map((branch, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all">
                                            <div className="size-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                <Building2 size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-900 truncate">{branch.name}</h4>
                                                <p className="text-xs text-slate-500 font-bold truncate">{branch.address}</p>
                                            </div>
                                            <button className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Contact info side */}
                        <div className="space-y-8">
                            <div className="p-8 bg-slate-900 rounded-4xl text-white">
                                <h3 className="text-lg font-black mb-6">Connect with us</h3>
                                <div className="space-y-5">
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                            <Phone size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">+234 800 VEMTAP</span>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                            <Mail size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">hello@{slug}.com</span>
                                    </div>
                                    <div className="flex items-center gap-4 group cursor-pointer">
                                        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors text-white">
                                            <Globe size={18} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">www.{slug}.com</span>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/10 flex justify-between">
                                    <button className="size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-indigo-500 hover:scale-110 transition-all">
                                        <Instagram size={20} />
                                    </button>
                                    <button className="size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-sky-500 hover:scale-110 transition-all">
                                        <Twitter size={20} />
                                    </button>
                                    <button className="size-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all">
                                        <Facebook size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 bg-white rounded-4xl border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Business Hours</h3>
                                <div className="space-y-4">
                                    {[
                                        { day: 'Mon - Fri', hours: '9:00 AM - 9:00 PM', status: 'Open' },
                                        { day: 'Saturday', hours: '10:00 AM - 11:00 PM', status: 'Open' },
                                        { day: 'Sunday', hours: 'Closed', status: 'Closed' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-slate-500">{item.day}</span>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900">{item.hours}</p>
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Open' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-20 text-center">
                    <p className="text-slate-400 font-bold text-sm tracking-tight mb-8">
                        Powered by <span className="font-black text-slate-900 tracking-tighter">VemTap</span> — Connecting businesses and customers smartly.
                    </p>
                    <button className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-xs hover:gap-4 transition-all">
                        Create your own Business Profile <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
