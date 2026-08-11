"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, ArrowRight, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';

/* ---------- small content helpers ---------- */

function Lead({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-[15px] md:text-base font-medium text-text-main leading-relaxed mb-4">
            {children}
        </p>
    );
}

function Body({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm md:text-[15px] text-text-secondary font-normal leading-relaxed mb-3 last:mb-0">
            {children}
        </p>
    );
}

function High({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm md:text-base font-semibold text-text-main leading-snug py-1.5 pl-3 border-l-2 border-primary/40 rounded-sm">
            {children}
        </p>
    );
}

function SubHead({ children }: { children: React.ReactNode }) {
    return (
        <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-2.5 mt-5 first:mt-0">
            {children}
        </h4>
    );
}

function List({ items }: { items: string[] }) {
    return (
        <ul className="space-y-2 my-4">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                    <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-[1px]">
                        <Check size={11} strokeWidth={3} />
                    </span>
                    <span className="text-sm md:text-[15px] text-text-secondary font-normal leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Chips({ items }: { items: string[] }) {
    return (
        <div className="flex flex-wrap gap-2 my-4">
            {items.map((item, i) => (
                <span key={i} className="px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold tracking-wider text-text-main">
                    {item}
                </span>
            ))}
        </div>
    );
}

function Grid({ items }: { items: { t: string; d: string }[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-5">
            {items.map((item, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-primary/20 hover:bg-primary/[0.02] transition-colors">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary mb-1.5">
                        {item.t}
                    </h4>
                    <p className="text-[13px] text-text-secondary font-normal leading-relaxed">{item.d}</p>
                </div>
            ))}
        </div>
    );
}

function Flow({ steps }: { steps: { t: string; d: string }[] }) {
    return (
        <div className="my-5">
            {steps.map((step, i) => (
                <div key={i} className="flex gap-3.5">
                    <div className="flex flex-col items-center">
                        <span className="size-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-md shadow-primary/15">
                            {i + 1}
                        </span>
                        {i < steps.length - 1 && (
                            <div className="w-px flex-1 bg-primary/10 my-1" />
                        )}
                    </div>
                    <div className={cn("flex-1 pb-4", i === steps.length - 1 && "pb-0")}>
                        <p className="font-bold text-text-main text-[13px] mb-0.5">{step.t}</p>
                        <p className="text-[13px] text-text-secondary font-normal leading-relaxed">{step.d}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PlanRow({ name, price, desc }: { name: string; price?: string; desc: string }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-4 py-3.5 hover:border-primary/20 transition-colors">
            <div>
                <p className="font-bold text-text-main text-sm">{name}</p>
                <p className="text-[13px] text-text-secondary font-normal mt-0.5">{desc}</p>
            </div>
            {price && (
                <span className="shrink-0 text-primary font-bold text-sm whitespace-nowrap">{price}</span>
            )}
        </div>
    );
}

/* ---------- 30-second video ---------- */

const YOUTUBE_ID = 'JUdg-g3_VSE';

function GuideVideo() {
    const [playing, setPlaying] = useState(false);
    const [thumbBroken, setThumbBroken] = useState(false);

    return (
        <div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-lg shadow-gray-200/60">
                {playing ? (
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
                        className="w-full h-full"
                        title="Turn Every Customer Into a Repeat Customer | VemTap"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="absolute inset-0 w-full h-full cursor-pointer group"
                        aria-label="Play video"
                    >
                        <Image
                            src={
                                thumbBroken
                                    ? `https://i.ytimg.com/vi/${YOUTUBE_ID}/hqdefault.jpg`
                                    : `https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`
                            }
                            alt="Turn Every Customer Into a Repeat Customer | VemTap"
                            onError={() => setThumbBroken(true)}
                            fill
                            sizes="(min-width: 768px) 768px, 100vw"
                            priority
                            className="object-cover pointer-events-none"
                        />
                        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="size-14 md:size-16 rounded-full bg-white/95 shadow-xl flex items-center justify-center text-gray-900 scale-95 group-hover:scale-105 transition-transform duration-300">
                                <Play size={20} fill="currentColor" className="ml-0.5" />
                            </span>
                        </span>
                    </button>
                )}
            </div>
            <div className="flex justify-center mt-3">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-100 bg-white px-3.5 py-1.5 text-[10px] font-semibold text-text-secondary">
                    <Play size={10} fill="currentColor" />
                    Watch How VEMTAP Works — 30 seconds
                </span>
            </div>
        </div>
    );
}

/* ---------- accordion data ---------- */

const sections: { num: string; title: string; body: React.ReactNode }[] = [
    {
        num: '01',
        title: 'What Is VEMTAP?',
        body: (
            <>
                <Lead>VEMTAP is a customer discovery and engagement platform built to help businesses get discovered, attract customers, engage them and build lasting customer relationships.</Lead>
                <Body>Your business may have great products, excellent services and attractive offers.</Body>
                <Body>But there are two things every business needs:</Body>
                <div className="my-4 space-y-2">
                    <High>Customers need to find you.</High>
                    <High>And once they do — you need to give them reasons to come back.</High>
                </div>
                <Body>VEMTAP brings these two sides together.</Body>
                <Chips items={['Discover', 'Engage', 'Convert', 'Retain', 'Grow']} />
            </>
        ),
    },
    {
        num: '02',
        title: 'The Problem VEMTAP Solves',
        body: (
            <>
                <SubHead>Customers don&apos;t know they exist</SubHead>
                <Body>A business can be located right next to thousands of potential customers and still be overlooked.</Body>
                <Body>Customers may not know:</Body>
                <List items={[
                    'Your business is there',
                    'What you sell',
                    'What services you offer',
                    'What offers you have',
                    'Why they should choose you',
                ]} />
                <Body>VEMTAP helps businesses become easier to discover.</Body>

                <SubHead>Customers who already know you may not keep coming back</SubHead>
                <Body>Getting a customer once is important. Keeping that customer engaged is even more valuable.</Body>
                <Body>VEMTAP helps businesses create opportunities to:</Body>
                <List items={[
                    'Stay connected',
                    'Promote new products',
                    'Share offers',
                    'Build loyalty',
                    'Collect feedback',
                    'Encourage repeat purchases',
                    'Generate referrals',
                ]} />
                <div className="my-4 space-y-2">
                    <High>The goal is not simply to get a customer once.</High>
                    <High>The goal is to build a customer relationship that continues to create value.</High>
                </div>
            </>
        ),
    },
    {
        num: '03',
        title: 'How VEMTAP Helps Your Business',
        body: (
            <>
                <Lead>VEMTAP works across the entire customer journey — from first discovery to long-term growth.</Lead>
                <Grid items={[
                    { t: 'Get Discovered', d: 'Help potential customers find your business, products, services and offers.' },
                    { t: 'Attract', d: 'Give customers more reasons to choose your business.' },
                    { t: 'Engage', d: 'Communicate and interact with your customers.' },
                    { t: 'Convert', d: 'Turn customer interest and discovery into real business opportunities.' },
                    { t: 'Retain', d: 'Give customers reasons to return.' },
                    { t: 'Build Loyalty', d: 'Create stronger and more valuable customer relationships.' },
                    { t: 'Get Referrals', d: 'Encourage satisfied customers to introduce others to your business.' },
                    { t: 'Grow', d: 'Turn customer discovery and relationships into continued business growth.' },
                ]} />
            </>
        ),
    },
    {
        num: '04',
        title: 'The VEMTAP Customer Growth Cycle',
        body: (
            <>
                <Lead>VEMTAP is designed around the complete customer journey.</Lead>
                <Flow steps={[
                    { t: 'Discover', d: 'A customer discovers your business.' },
                    { t: 'Explore', d: 'They learn about your business, products, services and offers.' },
                    { t: 'Engage', d: 'They interact with your business.' },
                    { t: 'Convert', d: 'They visit, contact you or make a purchase.' },
                    { t: 'Return', d: 'You give them reasons to come back.' },
                    { t: 'Loyalty', d: 'You build a stronger relationship with them.' },
                    { t: 'Refer', d: 'Satisfied customers recommend your business to others.' },
                    { t: 'Grow', d: 'Your customer relationships create more opportunities for your business.' },
                ]} />
                <High>VEMTAP helps your business work across the entire customer journey.</High>
            </>
        ),
    },
    {
        num: '05',
        title: 'Get Discovered by Customers Around You',
        body: (
            <>
                <SubHead>Your next customer may already be nearby</SubHead>
                <Body>Customers are constantly moving through:</Body>
                <List items={[
                    'Markets',
                    'Shopping centres',
                    'Streets',
                    'Offices',
                    'Neighbourhoods',
                    'Commercial areas',
                    'Events',
                    'Other high-footfall locations',
                ]} />
                <Body>But being close to a customer doesn&apos;t mean they know your business exists.</Body>
                <Body>VEMTAP is building a Business Discovery Network that helps customers discover businesses, products, services and offers around them.</Body>
                <High>The opportunity is simple: more discovery → more interest → more opportunities to sell.</High>
            </>
        ),
    },
    {
        num: '06',
        title: 'The VEMTAP Business Discovery Network',
        body: (
            <>
                <Lead>VEMTAP connects businesses and customers within local communities and commercial areas.</Lead>
                <Flow steps={[
                    { t: 'Local Area', d: 'A neighbourhood, town or commercial zone.' },
                    { t: 'Market / Cluster', d: 'Businesses grouped by location and category.' },
                    { t: 'VEMTAP Discovery Network', d: 'The shared network where businesses and customers meet.' },
                    { t: 'Businesses + Products + Offers', d: 'Everything a customer can discover and act on.' },
                    { t: 'Customers', d: 'The people who discover, visit and buy.' },
                ]} />
                <Body>As more businesses join a local network, customers have more businesses and offers to discover.</Body>
                <Body>As more customers use the network, participating businesses have more opportunities to be discovered.</Body>
                <div className="my-4 space-y-2">
                    <High>Businesses create the network.</High>
                    <High>Customers make the network valuable.</High>
                    <High>VEMTAP connects them.</High>
                </div>
            </>
        ),
    },
    {
        num: '07',
        title: 'Discover Businesses Through QR Codes',
        body: (
            <>
                <Lead>VEMTAP can connect physical locations with digital discovery.</Lead>
                <Body>QR codes can be placed in strategic locations such as:</Body>
                <List items={[
                    'Markets',
                    'Shopping centres',
                    'Commercial areas',
                    'Events',
                    'High-footfall locations',
                ]} />
                <Body>A customer can scan a VEMTAP QR code and discover participating businesses, products, services and offers within that area.</Body>
                <High>One scan can open the door to many local businesses.</High>
                <Body>Your business can become part of that discovery experience.</Body>
            </>
        ),
    },
    {
        num: '08',
        title: 'What Can Customers Discover?',
        body: (
            <>
                <Body>Through VEMTAP, customers can discover information about participating businesses, including:</Body>
                <List items={[
                    'Business information',
                    'Products',
                    'Services',
                    'Offers',
                    'Promotions',
                    'Locations',
                    'Contact options',
                    'Other available customer experiences',
                ]} />
                <Body>The objective is simple:</Body>
                <High>Make it easier for customers to discover businesses and take action.</High>
            </>
        ),
    },
    {
        num: '09',
        title: 'What Can Your Business Do With VEMTAP?',
        body: (
            <>
                <Lead>Depending on your plan, VEMTAP provides tools designed around customer discovery, engagement and growth.</Lead>
                <Grid items={[
                    { t: 'Business Discovery', d: 'Make your business easier for customers to discover.' },
                    { t: 'Catalogue', d: 'Showcase your products and services.' },
                    { t: 'Offers & Promotions', d: 'Give customers reasons to choose your business.' },
                    { t: 'Customer Engagement', d: 'Communicate and interact with customers.' },
                    { t: 'Messaging', d: 'Reach customers through available communication channels.' },
                    { t: 'Loyalty', d: 'Encourage customers to return.' },
                    { t: 'Feedback & Reviews', d: 'Understand what customers think about your business.' },
                    { t: 'Referrals', d: 'Turn satisfied customers into potential sources of new customers.' },
                    { t: 'Analytics', d: 'Understand customer activity and business performance.' },
                    { t: 'Marketing', d: 'Create and manage customer-focused marketing activities.' },
                ]} />
            </>
        ),
    },
    {
        num: '10',
        title: 'Businesses With Existing Customers',
        body: (
            <>
                <Lead>Having customers does not mean a business has reached its full potential.</Lead>
                <Body>Even established businesses can use VEMTAP to:</Body>
                <List items={[
                    'Reach new customers',
                    'Promote new products',
                    'Increase repeat purchases',
                    'Build customer loyalty',
                    'Communicate with customers',
                    'Collect feedback',
                    'Generate referrals',
                    'Understand customer behaviour',
                    'Strengthen customer relationships',
                ]} />
                <div className="my-4 space-y-2">
                    <High>More customers are valuable.</High>
                    <High>Better customer relationships are valuable.</High>
                    <High>More repeat business is valuable.</High>
                </div>
                <Body>VEMTAP is designed to help businesses work on all three.</Body>
            </>
        ),
    },
    {
        num: '11',
        title: 'More Than Advertising',
        body: (
            <>
                <Lead>Advertising can help people see your business. But visibility is only the beginning.</Lead>
                <Body>VEMTAP is designed to help businesses move from:</Body>
                <Flow steps={[
                    { t: 'Discovery', d: 'Customers find you.' },
                    { t: 'Engagement', d: 'Customers interact with you.' },
                    { t: 'Conversion', d: 'Customers have an opportunity to buy.' },
                    { t: 'Retention', d: 'Customers have reasons to return.' },
                    { t: 'Loyalty', d: 'Customers develop stronger relationships with your business.' },
                    { t: 'Referral', d: 'Customers help introduce others.' },
                    { t: 'Growth', d: 'Your customer relationships create more opportunities.' },
                ]} />
                <div className="my-4 space-y-2">
                    <High>We don&apos;t just want customers to see your business.</High>
                    <High>We want to help you build relationships with them.</High>
                </div>
            </>
        ),
    },
    {
        num: '12',
        title: 'Why Join the VEMTAP Network?',
        body: (
            <>
                <Lead>Your business doesn&apos;t have to grow alone.</Lead>
                <Body>VEMTAP is building a network where businesses and customers can connect within local communities and commercial areas.</Body>
                <Body>By joining, your business can become part of a growing ecosystem of:</Body>
                <Chips items={['Businesses', 'Customers', 'Products', 'Services', 'Offers', 'Local Discovery']} />
                <High>The bigger the network becomes, the more useful discovery can become for everyone participating.</High>
            </>
        ),
    },
    {
        num: '13',
        title: 'What Makes VEMTAP Different?',
        body: (
            <>
                <Lead>VEMTAP brings together two things businesses need:</Lead>
                <Grid items={[
                    { t: 'Customer Discovery', d: 'Help potential customers find you.' },
                    { t: 'Customer Engagement', d: 'Build relationships with the customers you already have.' },
                ]} />
                <Body>Instead of thinking only about:</Body>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5 my-3 text-text-main font-medium italic text-sm">
                    &ldquo;How do I advertise my business?&rdquo;
                </div>
                <Body>VEMTAP encourages businesses to think about the complete question:</Body>
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-4 py-3.5 my-3 text-text-main font-semibold leading-relaxed text-sm">
                    &ldquo;How do I get discovered, turn discovery into customers, keep those customers engaged and grow their value over time?&rdquo;
                </div>
            </>
        ),
    },
    {
        num: '14',
        title: 'Who Is VEMTAP For?',
        body: (
            <>
                <Lead>VEMTAP can support businesses at different stages of growth.</Lead>
                <Grid items={[
                    { t: 'New Businesses', d: 'Build visibility and start getting discovered.' },
                    { t: 'Growing Businesses', d: 'Reach more potential customers while building stronger customer relationships.' },
                    { t: 'Established Businesses', d: 'Engage existing customers, encourage repeat business and continue attracting new customers.' },
                    { t: 'Large Businesses & Organizations', d: 'Use a broader set of customer engagement, marketing, analytics and growth capabilities.' },
                ]} />
                <Body>Regardless of your current customer base, the objective is the same:</Body>
                <High>Build stronger customer relationships and create more opportunities for growth.</High>
            </>
        ),
    },
    {
        num: '15',
        title: 'Plans & Pricing',
        body: (
            <>
                <Lead>VEMTAP offers plans designed for different business needs.</Lead>
                <div className="space-y-2 my-5">
                    <PlanRow name="Free" desc="Start building your presence with VEMTAP." />
                    <PlanRow name="Silver" price="₦8,000/month" desc="For businesses ready for more customer engagement and growth capabilities." />
                    <PlanRow name="Gold" price="₦15,000/month" desc="For businesses looking for a broader set of tools to manage and grow customer relationships." />
                    <PlanRow name="Platinum" price="₦27,000/month" desc="For businesses requiring advanced customer engagement, growth and performance capabilities." />
                    <PlanRow name="Enterprise" desc="For organizations requiring customized solutions." />
                </div>
                <Link href="/pricing" className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:underline">
                    Compare Plans &amp; Features <ArrowRight size={14} />
                </Link>
            </>
        ),
    },
];

/* ---------- page ---------- */

export default function HowItWorksPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-24 md:pt-32 pb-20 px-6">
                {/* HERO */}
                <section className="container mx-auto max-w-3xl text-center mb-12 md:mb-16">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 rounded-full mb-5">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                            VEMTAP Business Guide
                        </span>
                    </div>
                    <h1 className="text-[28px] md:text-5xl lg:text-6xl font-bold text-text-main leading-[1.15] tracking-tight mb-5">
                        Get Discovered. Get Customers. <span className="text-primary">Keep Them Coming Back.</span>
                    </h1>
                    <p className="text-sm md:text-lg lg:text-xl text-text-secondary font-normal leading-relaxed mb-4">
                        VEMTAP helps businesses attract new customers, engage existing customers and grow customer relationships.
                    </p>
                    <p className="text-[13px] md:text-[15px] text-text-secondary font-normal opacity-70 max-w-xl mx-auto mb-8">
                        Whether you are looking for your next customer or already serve hundreds of customers, VEMTAP helps you build a stronger connection between your business and the people you want to serve.
                    </p>
                    <GuideVideo />
                </section>

                {/* GUIDE SECTIONS */}
                <section className="container mx-auto max-w-3xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gray-100" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary opacity-50">
                            Explore the Guide
                        </span>
                        <div className="h-px flex-1 bg-gray-100" />
                    </div>

                    <div className="space-y-2.5 md:space-y-3">
                        {sections.map((section, i) => {
                            const open = openIndex === i;
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'group rounded-2xl border transition-all duration-300 overflow-hidden',
                                        open
                                            ? 'border-primary/20 bg-white shadow-md shadow-primary/5'
                                            : 'border-gray-100 bg-white hover:border-gray-200'
                                    )}
                                >
                                    <button
                                        onClick={() => setOpenIndex(open ? null : i)}
                                        className="w-full text-left px-4 md:px-6 py-4 flex items-center gap-3.5 cursor-pointer appearance-none"
                                    >
                                        <span className={cn(
                                            'text-[11px] font-semibold tracking-wider shrink-0 transition-colors duration-300',
                                            open ? 'text-primary' : 'text-text-secondary opacity-40 group-hover:text-primary'
                                        )}>
                                            {section.num}
                                        </span>
                                        <span className={cn(
                                            'flex-1 text-[15px] md:text-base font-semibold tracking-tight transition-colors duration-300',
                                            open ? 'text-primary' : 'text-text-main group-hover:text-primary'
                                        )}>
                                            {section.title}
                                        </span>
                                        <span className={cn(
                                            'shrink-0 size-7 md:size-8 rounded-full flex items-center justify-center transition-all duration-300',
                                            open ? 'bg-primary/10 text-primary rotate-45' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                                        )}>
                                            <Plus size={15} />
                                        </span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {open && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 md:px-6 pb-6 md:pb-7 text-text-secondary">
                                                    {section.body}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className="container mx-auto max-w-4xl mt-16 md:mt-20">
                    <div className="relative overflow-hidden rounded-[2rem] bg-gray-50 border border-gray-100 px-6 py-12 md:px-14 md:py-16 text-center">
                        <div className="absolute -top-24 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[90px] pointer-events-none" />
                        <div className="absolute -bottom-24 left-0 w-72 h-72 bg-blue-400/5 rounded-full blur-[90px] pointer-events-none" />

                        <div className="relative z-10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-4">
                                Ready to Grow Your Business?
                            </p>
                            <h2 className="font-bold text-2xl md:text-4xl lg:text-5xl text-text-main leading-tight tracking-tight mb-8">
                                Your next customer may already be nearby.
                            </h2>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
                                <Link href="/get-started" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white font-bold uppercase tracking-wider text-[10px] px-8 py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95">
                                    Get Started with VEMTAP <ArrowRight size={13} />
                                </Link>
                                <Link href="/pricing" className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-gray-200 text-gray-900 font-bold uppercase tracking-wider text-[10px] px-8 py-4 rounded-xl hover:border-primary/40 hover:text-primary transition-all active:scale-95">
                                    View Plans &amp; Pricing
                                </Link>
                                <Link href="/contact" className="w-full sm:w-auto inline-flex items-center justify-center border border-gray-300 text-gray-600 font-bold uppercase tracking-wider text-[10px] px-8 py-4 rounded-xl hover:border-primary/40 hover:text-primary transition-all active:scale-95">
                                    Talk to a Representative
                                </Link>
                            </div>

                            <p className="text-sm md:text-base lg:text-lg text-text-secondary font-normal mb-6">
                                And the customers you already have are worth keeping. VEMTAP helps you do both.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-2">
                                {['Get Discovered', 'Get Customers', 'Engage Customers', 'Keep Customers', 'Grow Your Business'].map((t, i) => (
                                    <span key={i} className="px-3.5 py-1.5 rounded-full bg-white border border-gray-100 text-text-main text-[10px] font-bold tracking-wider">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}