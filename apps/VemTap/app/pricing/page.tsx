"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, ChevronDown, ChevronUp, Zap, 
    Building2, ArrowRight, ShieldCheck, Globe, 
    Star, Rocket, Check, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const plans = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        desc: 'Suitable for starters',
        features: ['100 Customer Profiles', 'Basic QR Code', 'Email Support', '1 Team Member', 'Standard Profile'],
        cta: 'Get Started',
        highlight: false,
    },
    {
        name: 'Silver',
        price: { monthly: 5000, yearly: 50000 },
        desc: 'Most Popular For Small Businesses',
        features: ['1,000 Customer Profiles', 'Unlimited QR Codes', 'Smart Messaging (SMS)', '3 Team Members', 'Premium Profile'],
        cta: 'Choose Silver',
        highlight: true,
    },
    {
        name: 'Gold',
        price: { monthly: 15000, yearly: 150000 },
        desc: 'Advanced tools for growth',
        features: ['5,000 Customer Profiles', 'NFC Plate Included', 'WhatsApp Automation', '10 Team Members', 'Full Analytics'],
        cta: 'Choose Gold',
        highlight: false,
    },
    {
        name: 'Platinum',
        price: { monthly: 35000, yearly: 350000 },
        desc: 'Complete power for scale',
        features: ['Unlimited Profiles', 'Discovery Network Ads', 'Priority Support', 'Unlimited Team', 'White-label Options'],
        cta: 'Choose Platinum',
        highlight: false,
    },
];

const faqs = [
    { q: 'What happens on Free Plan?', a: 'On the Free Plan, you can capture up to 100 customer profiles and use standard QR codes. It’s perfect for testing the waters and seeing the initial impact.' },
    { q: 'Can I upgrade later?', a: 'Yes! You can upgrade or downgrade your plan at any time directly from your dashboard. Changes take effect immediately.' },
    { q: 'Do you charge setup fees?', a: 'Zero. We believe in getting you started fast. There are no hidden setup or activation fees for any of our standard plans.' },
    { q: 'How does billing work?', a: 'We offer flexible monthly and annual billing. Annual plans come with a 20% discount. Payments are processed securely via our local payment gateways.' },
    { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time. Your access will remain active until the end of your current billing cycle.' },
];

export default function PricingPage() {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            
            <main className="pt-32 pb-24 px-6">
                {/* HERO SECTION */}
                <section className="container mx-auto max-w-6xl text-center mb-20">
                    <Badge className="bg-blue-50 text-[#066CF4] border-none px-4 py-1.5 font-black uppercase tracking-widest mb-6">
                        Transparent Pricing
                    </Badge>
                    <h1 className="text-4xl md:text-7xl font-black text-gray-900 leading-tight mb-8">
                        Simple Pricing For <br /> <span className="text-[#066CF4]">Every Business</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium max-w-xl mx-auto mb-12">
                        Choose the plan that fits your growth stage. Scale up whenever you're ready.
                    </p>
                    
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billing === 'monthly' ? "text-gray-900" : "text-gray-400")}>Monthly</span>
                        <button 
                            onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-16 h-9 bg-gray-100 rounded-full p-1 relative transition-all"
                        >
                            <motion.div 
                                animate={{ x: billing === 'monthly' ? 0 : 28 }}
                                className="size-7 bg-[#066CF4] rounded-full shadow-lg"
                            />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", billing === 'yearly' ? "text-gray-900" : "text-gray-400")}>Yearly</span>
                            <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black uppercase">Save 20%</Badge>
                        </div>
                    </div>
                </section>

                {/* PRICING CARDS */}
                <section className="container mx-auto max-w-7xl mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan, index) => (
                            <div 
                                key={index} 
                                className={cn(
                                    "p-10 rounded-[48px] border transition-all duration-500 flex flex-col",
                                    plan.highlight 
                                        ? "bg-[#066CF4] text-white border-[#066CF4] shadow-2xl shadow-blue-500/30 scale-105 z-10" 
                                        : "bg-white border-gray-100 shadow-sm hover:shadow-xl"
                                )}
                            >
                                <div className="mb-8">
                                    <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                                    <p className={cn("text-xs font-bold uppercase tracking-widest", plan.highlight ? "text-white/70" : "text-gray-400")}>{plan.desc}</p>
                                </div>
                                
                                <div className="mb-10">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black">₦{plan.price[billing].toLocaleString()}</span>
                                        <span className={cn("text-xs font-bold uppercase tracking-widest opacity-60")}>/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-12 flex-1">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-center gap-3 text-sm font-bold">
                                            <div className={cn("size-5 rounded-full flex items-center justify-center", plan.highlight ? "bg-white/20 text-white" : "bg-blue-50 text-[#066CF4]")}>
                                                <CheckCircle2 size={12} strokeWidth={4} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link href="/get-started">
                                    <Button className={cn(
                                        "w-full h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95",
                                        plan.highlight ? "bg-white text-[#066CF4] shadow-xl hover:bg-gray-50" : "bg-gray-900 text-white hover:bg-[#066CF4]"
                                    )}>
                                        {plan.cta}
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ENTERPRISE CTA */}
                <section className="container mx-auto max-w-5xl mb-32">
                   <div className="bg-gray-900 rounded-[60px] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#066CF4]/10 rounded-full blur-3xl" />
                      <div className="max-w-xl text-center md:text-left relative z-10">
                         <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6">Need A Custom <br /> Enterprise Solution?</h2>
                         <p className="text-lg font-medium text-white/60 mb-0">We offer white-labeling, custom hardware, and multi-location management for large franchises.</p>
                      </div>
                      <Link href="/contact" className="shrink-0 relative z-10">
                         <Button className="h-16 px-12 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                            Contact Sales
                         </Button>
                      </Link>
                   </div>
                </section>

                {/* FAQ SECTION */}
                <section className="container mx-auto max-w-3xl">
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 text-center mb-16">Got Questions?</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-100 rounded-[32px] overflow-hidden bg-white shadow-sm">
                                <button 
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full p-8 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                >
                                    <span className="text-lg font-bold text-gray-900">{faq.q}</span>
                                    <div className={cn("size-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300", openFaq === index && "rotate-180")}>
                                        <ChevronDown size={20} className="text-gray-400" />
                                    </div>
                                </button>
                                <AnimatePresence>
                                    {openFaq === index && (
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="p-8 pt-0 text-gray-500 font-medium leading-relaxed">{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
