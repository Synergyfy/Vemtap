"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Play, CheckCircle2, QrCode, MessageSquare, 
  BarChart3, Image as ImageIcon, Globe, 
  Zap, Star, Users, X,
  ChevronRight, Rocket, HardDrive, LineChart, UserMinus, Database, RefreshCw, DollarSign, TrendingDown, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const badgeClass = 'bg-[#066CF4]/10 text-[#066CF4] border-none px-3.5 py-1.5 font-bold uppercase tracking-wider';
const primaryBtn = 'bg-[#066CF4] text-white font-bold uppercase tracking-wider text-xs px-8 h-12 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all';

export default function ForBusinessesPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-14 pb-20 px-6">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-blue-50/50 rounded-bl-[100px] -z-10" />
          <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <Badge className={badgeClass + " mb-5"}>
                Customer Engagement Platform
              </Badge>
              <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-[68px] font-bold text-gray-900 leading-[1.08] mb-6 max-w-xl mx-auto lg:mx-0 tracking-tight">
                Turn Every Customer Into A <span className="text-[#066CF4]">Customer You Can Reach Again.</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-500 font-normal max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                We help businesses capture customer details, build lasting relationships, automate follow-ups, and increase repeat sales...
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/get-started" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#066CF4] text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                    Get Started
                  </Button>
                </Link>
                <button 
                  onClick={() => setIsVideoModalOpen(true)}
                  className="flex items-center gap-3 px-6 py-3 text-gray-900 font-bold uppercase tracking-wider text-[11px] hover:text-[#066CF4] transition-colors"
                >
                  <div className="size-10 rounded-full bg-white shadow-lg flex items-center justify-center text-[#066CF4]">
                    <Play size={16} fill="currentColor" />
                  </div>
                  Watch Demo
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative lg:mt-0"
            >
              <div className="relative mx-auto w-full max-w-[300px] aspect-[9/18.5] bg-gray-900 rounded-[2.5rem] border-[8px] border-gray-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full w-full bg-black relative">
                  <video
                    src="/assets/videos/hero.webm"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Floating element */}
              <div className="absolute -right-8 top-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New Growth</p>
                    <p className="text-lg font-bold text-gray-900">+124 Customers</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-14 md:py-18 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight tracking-tight">Most Businesses Lose <br /> Customers Every Day</h2>
              <div className="h-1 w-16 bg-red-500 rounded-full mx-auto mt-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: 'Customers Visit Once', desc: 'They come, they spend, and they disappear forever.', icon: UserMinus },
                { title: 'No Customer Database', desc: 'Operating blindly without knowing who your real buyers are.', icon: Database },
                { title: 'No Follow Up System', desc: 'Zero automation to bring visitors back into your store.', icon: RefreshCw },
                { title: 'Expensive Advertising', desc: 'Wasting money on ads for people who have already visited.', icon: DollarSign },
                { title: 'Lost Sales Opportunities', desc: 'Missing the chance to announce new products or deals.', icon: TrendingDown },
              ].map((item, i) => (
                <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500 group">
                  <div className="flex items-start gap-4">
                    <div className="size-10 shrink-0 rounded-xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-xs sm:text-sm font-normal text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section className="py-14 md:py-18 bg-[#066CF4] rounded-[36px] md:rounded-[60px] mx-4 md:mx-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-40 -mb-40 blur-3xl" />
          
          <div className="container mx-auto max-w-6xl relative z-10 px-4">
            <div className="text-center mb-10">
              <Badge className="bg-white/15 text-white border-none px-3.5 py-1.5 font-bold uppercase tracking-wider mb-5">
                The Vemtap Solution
              </Badge>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">Vemtap Solves This</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: QrCode, title: 'Customer Capture', desc: 'Instant registration using high-end QR and NFC hardware.' },
                { icon: MessageSquare, title: 'Smart Messaging', desc: 'Personalized WhatsApp and SMS marketing that works.' },
                { icon: BarChart3, title: 'Growth Analytics', desc: 'See your database grow with real-time visit tracking.' },
                { icon: ImageIcon, title: 'Marketing Assets', desc: 'Professional ready-to-print materials for your shop.' },
                { icon: Star, title: 'Customer Retention', desc: 'Automated rewards and follow-ups to increase repeat visits.' },
                { icon: Globe, title: 'Business Discovery', desc: 'Get found by new customers in our local discovery network.' },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300">
                  <div className="size-12 rounded-xl bg-white text-[#066CF4] flex items-center justify-center mb-5">
                    
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm font-normal text-white/75 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS PREVIEW */}
        <section className="py-14 md:py-18 px-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-3">How Vemtap Works</h2>
              <p className="text-base font-normal text-gray-500">6 simple steps to transform your physical space.</p>
            </div>

            <div className="relative">
              <div className="flex flex-col md:flex-row gap-5 md:overflow-x-auto no-scrollbar pb-8">
                {[
                  { title: 'Generate QR', num: '01' },
                  { title: 'Place QR', num: '02' },
                  { title: 'Customer Scans', num: '03' },
                  { title: 'Customer Registers', num: '04' },
                  { title: 'Data Captured', num: '05' },
                  { title: 'Follow Up', num: '06' },
                ].map((step, i) => (
                  <div key={i} className="flex-shrink-0 w-full md:w-[280px] p-6 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col items-center text-center relative group">
                    <div className="size-14 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold text-[#066CF4] mb-5 group-hover:bg-[#066CF4] group-hover:text-white transition-all">
                      {step.num}
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">{step.title}</h3>
                    {i < 5 && (
                      <ArrowRight size={20} className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link href="/how-it-works">
                <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-wider text-[#066CF4] hover:bg-blue-50">
                  See Full Demo <ChevronRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-14 md:py-18 px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              <div className="lg:col-span-1">
                <Badge className={badgeClass + " mb-5"}>
                  Why Us?
                </Badge>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">Why Businesses <br /> Choose Vemtap</h2>
                <div className="space-y-3.5">
                  {[
                    'Zero setup fees',
                    'No hardware needed to start',
                    'GDPR & Data compliant',
                    '24/7 Dedicated support'
                  ].map(benefit => (
                    <div key={benefit} className="flex items-center gap-3">
                      <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 size={12} strokeWidth={4} />
                      </div>
                      <span className="text-sm font-normal text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Capture More Customers', icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { title: 'Increase Repeat Visits', icon: Rocket, color: 'bg-purple-50 text-purple-600' },
                  { title: 'Build Customer Database', icon: HardDrive, color: 'bg-emerald-50 text-emerald-600' },
                  { title: 'Track Customer Growth', icon: LineChart, color: 'bg-amber-50 text-amber-600' },
                  { title: 'Send Promotions Easily', icon: Sparkles, color: 'bg-rose-50 text-rose-600' },
                  { title: 'Generate More Revenue', icon: Zap, color: 'bg-orange-50 text-orange-600' },
                ].map((item, i) => (
                  <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-500">
                    <div className="flex items-start gap-3">
                      <div className={cn("size-10 shrink-0 rounded-xl flex items-center justify-center", item.color)}>
                        <item.icon size={20} />
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 pt-1.5">{item.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DISCOVERY NETWORK SECTION */}
        <section className="py-14 md:py-18 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-[#066CF4]/5 rounded-[40px] p-8 md:p-16 border border-[#066CF4]/10">
              <div>
                <Badge className="bg-[#066CF4] text-white border-none px-3.5 py-1.5 font-bold uppercase tracking-wider mb-5">
                  Vemtap Discovery
                </Badge>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">Get Discovered By More Customers</h2>
                <p className="text-base font-normal text-gray-500 mb-8 leading-relaxed">
                  Businesses inside Vemtap become discoverable to customers already interacting with other Vemtap businesses nearby. Grow your visibility through our network.
                </p>
                <Link href="/marketplace">
                  <Button className="h-12 px-8 rounded-xl bg-white text-gray-900 border border-gray-200 shadow-sm text-xs font-bold uppercase tracking-wider hover:bg-gray-50 active:scale-95 transition-all">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="relative">
                 <div className="aspect-square bg-[#066CF4] rounded-full blur-[120px] opacity-20 absolute inset-0" />
                 <div className="relative grid grid-cols-2 gap-4">
                    <div className="space-y-4 mt-8">
                       <div className="h-36 bg-white rounded-3xl shadow-xl p-6 border border-gray-100 rotate-[-5deg]">
                          <div className="size-10 rounded-xl bg-blue-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                       <div className="h-36 bg-white rounded-3xl shadow-xl p-6 border border-gray-100 rotate-[3deg]">
                          <div className="size-10 rounded-xl bg-purple-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="h-36 bg-white rounded-3xl shadow-xl p-6 border border-gray-100 rotate-[5deg]">
                          <div className="size-10 rounded-xl bg-emerald-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                       <div className="h-36 bg-white rounded-3xl shadow-xl p-6 border border-gray-100 rotate-[-3deg]">
                          <div className="size-10 rounded-xl bg-amber-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section className="py-14 md:py-18 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-8">What Business Owners Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm text-left flex flex-col h-full">
                  <div className="flex gap-1 text-amber-400 mb-5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={15} fill="currentColor" />)}
                  </div>
                  <p className="text-[15px] font-normal text-gray-600 mb-7 leading-relaxed italic flex-1">
                    &quot;Vemtap has completely changed how we engage with our weekend crowd. We captured 200 emails in the first week alone!&quot;
                  </p>
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-50">
                    <div className="size-11 rounded-full bg-gray-100" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">John O.</p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Coffee House Owner</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section id="cta" className="py-14 md:py-18 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="size-16 rounded-2xl bg-[#066CF4] text-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/30">
              <Rocket size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 leading-[1.1] tracking-tight">Start Growing Your <br /> Customer Base Today</h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-500 font-normal mb-9">No credit card required. Setup in minutes.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/get-started">
                  <Button className={primaryBtn}>
                    Get Started
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="h-12 px-8 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition-all">
                    Contact Sales
                  </Button>
                </Link>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 z-10 size-10 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition-colors border border-white/20 backdrop-blur-md"
              >
                <X size={20} />
              </button>
              <video
                src="/assets/videos/vemtap-exp.webm"
                autoPlay
                controls
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <a href="#cta" onClick={() => setIsVideoModalOpen(false)} className="px-6 py-2.5 bg-white text-gray-900 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-gray-100 transition-all shadow-lg">
                  Get Started
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}