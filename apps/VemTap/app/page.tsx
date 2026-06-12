"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Play, CheckCircle2, QrCode, MessageSquare, 
  BarChart3, Image as ImageIcon, Globe, ShieldCheck, 
  Zap, Star, Users, Utensils, Calendar, X, Building2,
  ChevronRight, Smartphone, Monitor, Layout, Rocket,
  Sparkles, Coffee, ShoppingBag, Scissors, Dumbbell, 
  Hotel, Store, HardDrive, LineChart
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-24 px-6">
          <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-blue-50/50 rounded-bl-[100px] -z-10" />
          <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center lg:text-left"
            >
              <Badge className="bg-blue-50 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                Customer Engagement Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-8">
                Turn Every Visitor <br className="hidden md:block" /> Into A Customer <br className="hidden md:block" /> <span className="text-[#066CF4]">You Can Reach Again</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 font-medium max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
                Capture customer details using QR codes and NFC technology. Build your customer database, send smart messages, and grow your business.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/get-started" className="w-full sm:w-auto">
                  <Button className="h-16 px-10 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                    Start Free
                  </Button>
                </Link>
                <button className="flex items-center gap-3 px-8 py-4 text-gray-900 font-black uppercase tracking-widest text-xs hover:text-[#066CF4] transition-colors">
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
              className="relative"
            >
              <div className="relative mx-auto w-full max-w-[400px] aspect-[9/18.5] bg-gray-900 rounded-[3rem] border-[10px] border-gray-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="h-full w-full bg-white p-6 pt-12">
                   {/* Simplified Dashboard Illustration */}
                   <div className="space-y-6">
                     <div className="flex justify-between items-center">
                       <div className="size-8 rounded-full bg-blue-50" />
                       <div className="w-20 h-2 bg-gray-100 rounded" />
                     </div>
                     <div className="h-32 w-full bg-blue-50 rounded-2xl p-4">
                       <div className="w-1/2 h-4 bg-[#066CF4]/20 rounded mb-2" />
                       <div className="w-3/4 h-8 bg-[#066CF4] rounded-lg" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="h-24 bg-gray-50 rounded-2xl" />
                       <div className="h-24 bg-gray-50 rounded-2xl" />
                     </div>
                     <div className="space-y-3">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="h-12 bg-gray-50 rounded-xl flex items-center px-4 gap-3">
                           <div className="size-6 rounded-full bg-white shadow-sm" />
                           <div className="w-24 h-2 bg-gray-200 rounded" />
                         </div>
                       ))}
                     </div>
                   </div>
                </div>
              </div>
              {/* Floating element */}
              <div className="absolute -right-8 top-1/4 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Growth</p>
                    <p className="text-lg font-black text-gray-900">+124 Customers</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="py-20 border-y border-gray-50 bg-gray-50/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-12">Trusted By Growing Businesses</h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               {[
                 { icon: Utensils, label: 'Restaurant' },
                 { icon: Scissors, label: 'Salon' },
                 { icon: ShoppingBag, label: 'Fashion' },
                 { icon: Dumbbell, label: 'Gym' },
                 { icon: Hotel, label: 'Hotel' },
                 { icon: Store, label: 'Supermarket' },
                 { icon: Monitor, label: 'Electronics' },
                 { icon: Building2, label: 'Small Biz' },
               ].map((cat, i) => (
                 <div key={i} className="flex flex-col items-center gap-3">
                   <cat.icon size={24} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Most Businesses Lose <br /> Customers Every Day</h2>
              <div className="h-1.5 w-24 bg-red-500 rounded-full mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Customers Visit Once', desc: 'They come, they spend, and they disappear forever.' },
                { title: 'No Customer Database', desc: 'Operating blindly without knowing who your real buyers are.' },
                { title: 'No Follow Up System', desc: 'Zero automation to bring visitors back into your store.' },
                { title: 'Expensive Advertising', desc: 'Wasting money on ads for people who have already visited.' },
                { title: 'Lost Sales Opportunities', desc: 'Missing the chance to announce new products or deals.' },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="size-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <X size={24} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-3">❌ {item.title}</h3>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section className="py-32 px-6 bg-[#066CF4] rounded-[60px] md:rounded-[100px] mx-4 md:mx-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full -ml-40 -mb-40 blur-3xl" />
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-20">
              <Badge className="bg-white/20 text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                The Vemtap Solution
              </Badge>
              <h2 className="text-3xl md:text-6xl font-black leading-tight">Vemtap Solves This</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: QrCode, title: 'Customer Capture', desc: 'Instant registration using high-end QR and NFC hardware.' },
                { icon: MessageSquare, title: 'Smart Messaging', desc: 'Personalized WhatsApp and SMS marketing that works.' },
                { icon: BarChart3, title: 'Growth Analytics', desc: 'See your database grow with real-time visit tracking.' },
                { icon: ImageIcon, title: 'Marketing Assets', desc: 'Professional ready-to-print materials for your shop.' },
                { icon: Star, title: 'Customer Retention', desc: 'Automated rewards and follow-ups to increase repeat visits.' },
                { icon: Globe, title: 'Business Discovery', desc: 'Get found by new customers in our local discovery network.' },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-[40px] bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all duration-300">
                  <div className="size-14 rounded-2xl bg-white text-[#066CF4] flex items-center justify-center mb-6">
                    <item.icon size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-3">{item.title}</h3>
                  <p className="text-sm font-medium text-white/70 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS PREVIEW */}
        <section className="py-32 px-6 overflow-hidden">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">How Vemtap Works</h2>
              <p className="text-lg font-medium text-gray-500">6 simple steps to transform your physical space.</p>
            </div>

            <div className="relative">
              <div className="flex flex-col md:flex-row gap-6 md:overflow-x-auto no-scrollbar pb-10">
                {[
                  { title: 'Generate QR', num: '01' },
                  { title: 'Place QR', num: '02' },
                  { title: 'Customer Scans', num: '03' },
                  { title: 'Customer Registers', num: '04' },
                  { title: 'Data Captured', num: '05' },
                  { title: 'Follow Up', num: '06' },
                ].map((step, i) => (
                  <div key={i} className="flex-shrink-0 w-full md:w-[280px] p-8 rounded-[32px] bg-gray-50 border border-gray-100 flex flex-col items-center text-center relative group">
                    <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl font-black text-[#066CF4] mb-6 group-hover:bg-[#066CF4] group-hover:text-white transition-all">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{step.title}</h3>
                    {i < 5 && (
                      <ArrowRight size={24} className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link href="/how-it-works">
                <Button variant="outline" className="h-14 px-10 rounded-2xl border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#066CF4] hover:bg-blue-50">
                  See Full Demo <ChevronRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* BENEFITS SECTION */}
        <section className="py-32 px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
              <div className="lg:col-span-1">
                <Badge className="bg-[#066CF4]/10 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                  Why Us?
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">Why Businesses <br /> Choose Vemtap</h2>
                <div className="space-y-4">
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
                      <span className="text-sm font-bold text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Capture More Customers', icon: Users, color: 'bg-blue-50 text-blue-600' },
                  { title: 'Increase Repeat Visits', icon: Rocket, color: 'bg-purple-50 text-purple-600' },
                  { title: 'Build Customer Database', icon: HardDrive, color: 'bg-emerald-50 text-emerald-600' },
                  { title: 'Track Customer Growth', icon: LineChart, color: 'bg-amber-50 text-amber-600' },
                  { title: 'Send Promotions Easily', icon: Sparkles, color: 'bg-rose-50 text-rose-600' },
                  { title: 'Generate More Revenue', icon: Zap, color: 'bg-orange-50 text-orange-600' },
                ].map((item, i) => (
                  <div key={i} className="p-8 rounded-[40px] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className={cn("size-14 rounded-2xl flex items-center justify-center mb-6", item.color)}>
                      <item.icon size={28} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">{item.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* DISCOVERY NETWORK SECTION */}
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bg-[#066CF4]/5 rounded-[60px] p-10 md:p-20 border border-[#066CF4]/10">
              <div>
                <Badge className="bg-[#066CF4] text-white border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                  Vemtap Discovery
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">Get Discovered By More Customers</h2>
                <p className="text-lg font-medium text-gray-500 mb-10 leading-relaxed">
                  Businesses inside Vemtap become discoverable to customers already interacting with other Vemtap businesses nearby. Grow your visibility through our network.
                </p>
                <Link href="/marketplace">
                  <Button className="h-14 px-8 rounded-2xl bg-white text-gray-900 border border-gray-200 shadow-sm text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="relative">
                 <div className="aspect-square bg-[#066CF4] rounded-full blur-[120px] opacity-20 absolute inset-0" />
                 <div className="relative grid grid-cols-2 gap-4">
                    <div className="space-y-4 mt-8">
                       <div className="h-40 bg-white rounded-[32px] shadow-2xl p-6 border border-gray-100 rotate-[-5deg]">
                          <div className="size-10 rounded-xl bg-blue-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                       <div className="h-40 bg-white rounded-[32px] shadow-2xl p-6 border border-gray-100 rotate-[3deg]">
                          <div className="size-10 rounded-xl bg-purple-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="h-40 bg-white rounded-[32px] shadow-2xl p-6 border border-gray-100 rotate-[5deg]">
                          <div className="size-10 rounded-xl bg-emerald-50 mb-4" />
                          <div className="w-full h-3 bg-gray-50 rounded" />
                       </div>
                       <div className="h-40 bg-white rounded-[32px] shadow-2xl p-6 border border-gray-100 rotate-[-3deg]">
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
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-20">What Business Owners Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-10 rounded-[40px] bg-white border border-gray-100 shadow-sm text-left">
                  <div className="flex gap-1 text-amber-400 mb-6">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill="currentColor" />)}
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-8 leading-relaxed italic">
                    "Vemtap has completely changed how we engage with our weekend crowd. We captured 200 emails in the first week alone!"
                  </p>
                  <div className="flex items-center gap-4 pt-8 border-t border-gray-50">
                    <div className="size-12 rounded-full bg-gray-100" />
                    <div>
                      <p className="text-sm font-black text-gray-900">John O.</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coffee House Owner</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-32 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="size-20 rounded-[28px] bg-[#066CF4] text-white flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-500/30">
              <Rocket size={40} />
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">Start Growing Your <br /> Customer Base Today</h2>
            <p className="text-xl text-gray-500 font-medium mb-12">No credit card required. Setup in minutes.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/get-started">
                  <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                    Start Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="h-16 px-12 rounded-2xl border-gray-100 text-sm font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 transition-all">
                    Contact Sales
                  </Button>
                </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
