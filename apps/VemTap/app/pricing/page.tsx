"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, ChevronDown, ChevronUp, Zap,
    Building2, ArrowRight, ShieldCheck, Globe,
    Star, Rocket, Check, HelpCircle, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePricingPlans } from '@/services/pricing/hooks';
import type { PricingPlan } from '@/types/pricing';
import PlanComparisonTable from '@/components/pricing/PlanComparisonTable';

const badgeClass = 'bg-[#066CF4]/10 text-[#066CF4] border-none px-3.5 py-1.5 font-bold uppercase tracking-wider';
const primaryBtn = 'h-12 px-8 rounded-xl bg-[#066CF4] text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-500/20 hover:bg-[#066CF4]/90 active:scale-95 transition-all';

const faqs = [
    { q: 'What happens on Free Plan?', a: 'On the Free Plan, you can capture up to 100 customer profiles and use standard QR codes. It’s perfect for testing the waters and seeing the initial impact.' },
    { q: 'Can I upgrade later?', a: 'Yes! You can upgrade or downgrade your plan at any time directly from your dashboard. Changes take effect immediately.' },
    { q: 'Do you charge setup fees?', a: 'Zero. We believe in getting you started fast. There are no hidden setup or activation fees for any of our standard plans.' },
    { q: 'How does billing work?', a: 'We offer flexible monthly and annual billing. Annual plans come with a 20% discount. Payments are processed securely via our local payment gateways.' },
    { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time. Your access will remain active until the end of your current billing cycle.' },
];

const normalizeFeatures = (plan: PricingPlan) => {
    const baseFeatures = Array.isArray(plan.features) ? plan.features.filter(Boolean) : [];
    return { included: baseFeatures, limits: [] };
};

export default function PricingPage() {
    const router = useRouter();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const { data: plans = [], isLoading } = usePricingPlans();

    const activePlans = plans.filter(p => p.isActive);

    const standardPlans = activePlans.filter(p => !p.name.toLowerCase().includes('enterprise'));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center py-40">
                    <Loader2 size={40} className="animate-spin text-[#066CF4]" />
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 md:pt-32 pb-20 px-6">
                {/* HERO SECTION */}
                <section className="container mx-auto max-w-4xl text-center mb-16">
                    <Badge className={badgeClass + " mb-5"}>
                        Transparent Pricing
                    </Badge>
                    <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] mb-6 tracking-tight">
                        Simple Pricing For <br /> <span className="text-[#066CF4]">Every Business</span>
                    </h1>
                    <p className="text-base md:text-lg lg:text-xl text-gray-500 font-normal max-w-xl mx-auto mb-10">
                        Choose the plan that fits your growth stage. Scale up whenever you're ready.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={cn("text-xs font-bold uppercase tracking-wider transition-colors", billing === 'monthly' ? "text-gray-900" : "text-gray-400")}>Monthly</span>
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
                            <span className={cn("text-xs font-bold uppercase tracking-wider transition-colors", billing === 'yearly' ? "text-gray-900" : "text-gray-400")}>Yearly</span>
                            <Badge className="bg-emerald-500 text-white border-none text-[10px] font-bold uppercase">Save 20%</Badge>
                        </div>
                    </div>
                </section>

                {/* PRICING CARDS */}
                <section className="container mx-auto max-w-7xl mb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {standardPlans.map((plan, index) => {
                            const highlight = plan.isPopular ?? false;
                            const isFree = plan.isFree;
                            const price = billing === 'yearly'
                                ? (plan.pricing?.yearly?.totalPrice ?? plan.yearlyPriceWithTax ?? plan.yearlyPrice)
                                : (plan.pricing?.monthly?.totalPrice ?? plan.monthlyPriceWithTax ?? plan.monthlyPrice);
                            const features = normalizeFeatures(plan);

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative p-6 rounded-2xl border transition-all duration-500 flex flex-col",
                                        highlight
                                            ? "bg-[#066CF4] text-white border-[#066CF4] shadow-xl shadow-blue-500/25 z-10"
                                            : "bg-white border-gray-100 shadow-sm hover:shadow-lg"
                                    )}
                                >
                                    {highlight && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#066CF4] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="mb-6 pt-1">
                                        <h3 className="text-xl font-bold mb-1.5">{plan.name}</h3>
                                        <p className={cn("text-xs font-medium uppercase tracking-wider", highlight ? "text-white/70" : "text-gray-400")}>
                                            {plan.description || 'Suitable for your business'}
                                        </p>
                                    </div>

                                    <div className="mb-7">
                                        {isFree ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold">Free</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold">₦{price.toLocaleString()}</span>
                                                <span className={cn("text-xs font-medium uppercase tracking-wider opacity-60")}>/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                                            </div>
                                        )}
                                        {!isFree && plan.tax && plan.tax.isEnabled && (
                                            <p className={cn("text-[10px] font-semibold mt-1", highlight ? "text-white/60" : "text-gray-400")}>
                                                Tax inclusive · {plan.tax.name}{plan.tax.taxType === 'percentage' ? ` ${plan.tax.rate}%` : ''}
                                            </p>
                                        )}
                                    </div>

                                    <ul className="space-y-2.5 mb-8 flex-1">
                                        {features.included.map((feature, fIndex) => (
                                            <li key={`inc-${fIndex}`} className="flex items-center gap-2.5 text-[13px] font-normal">
                                                <div className={cn("size-5 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-white/20 text-white" : "bg-blue-50 text-[#066CF4]")}>
                                                    <CheckCircle2 size={12} strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                        {features.limits.length > 0 && (
                                            <li className="pt-4 border-t border-dashed opacity-30" />
                                        )}
                                        {features.limits.map((feature, fIndex) => (
                                            <li key={`lim-${fIndex}`} className="flex items-center gap-2.5 text-[13px] font-normal">
                                                <div className={cn("size-5 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-white/20 text-white" : "bg-blue-50 text-[#066CF4]")}>
                                                    <CheckCircle2 size={12} strokeWidth={4} />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link href={`/get-started?plan=${plan.id}&billing=${billing}`}>
                                        <Button className={cn(
                                            "w-full h-11 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95",
                                            highlight ? "bg-white text-[#066CF4] shadow-md hover:bg-gray-100" : "bg-gray-900 text-white hover:bg-[#066CF4]"
                                        )}>
                                            {isFree ? 'Get Started' : 'Choose ' + plan.name}
                                        </Button>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* COMPARISON TABLE */}
                <PlanComparisonTable plans={standardPlans} />

                {/* ENTERPRISE CTA */}
                <section className="container mx-auto max-w-5xl mb-20">
                    <div className="bg-gray-900 rounded-[36px] p-8 md:p-14 text-white flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#066CF4]/10 rounded-full blur-3xl" />
                        <div className="max-w-xl text-center md:text-left relative z-10">
                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-4">Need A Custom <br /> Enterprise Solution?</h2>
                            <p className="text-base font-normal text-white/60 mb-0">We offer white-labeling, custom hardware, and multi-location management for large franchises.</p>
                        </div>
                        <Link href="/contact" className="shrink-0 relative z-10">
                            <Button className={primaryBtn}>
                                Contact Sales
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* FAQ SECTION */}
                <section className="container mx-auto max-w-3xl">
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-12 tracking-tight">Got Questions?</h2>
                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full p-5 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                                >
                                    <span className="text-[15px] font-semibold text-gray-900 pr-4">{faq.q}</span>
                                    <div className={cn("size-8 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300 shrink-0", openFaq === index && "rotate-180")}>
                                        <ChevronDown size={18} className="text-gray-400" />
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
                                            <p className="p-5 md:p-6 pt-0 text-sm text-gray-500 font-normal leading-relaxed">{faq.a}</p>
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