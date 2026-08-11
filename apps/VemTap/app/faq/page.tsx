'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string | null>('general-0');

    const categories = [
        {
            id: 'general',
            title: 'General',
            icon: 'info',
            questions: [
                {
                    q: "Do visitors need to download an app?",
                    a: "No. That's the beauty of VemTap. Visitors simply tap their phone against the NFC tag, and your custom landing page opens instantly in their default mobile browser. It works with 99% of modern smartphones."
                },
                {
                    q: "What is NFC and how does it work?",
                    a: "NFC (Near Field Communication) is a short-range wireless technology that allows data exchange between devices with a simple tap. It's the same technology used for Apple Pay and Google Pay."
                },
                {
                    q: "What happens if a visitor doesn't have NFC?",
                    a: "Every VemTap tag comes with a high-resolution, branded QR code. If a visitor has an older device without NFC, they can simply scan the QR code to access the same experience."
                }
            ]
        },
        {
            id: 'hardware',
            title: 'Tags & Setup',
            icon: 'nfc',
            questions: [
                {
                    q: "How do I set up the NFC tags?",
                    a: "Setup takes less than 2 minutes. Once you receive your VemTap tags, enter the activation code in your dashboard, choose your destination URL, and place the tag on any non-metallic surface."
                },
                {
                    q: "Where should I place my tags?",
                    a: "Strategic points work best: reception desks, checkout counters, restaurant tables, or even product displays. Anywhere a customer naturally stops for a few seconds."
                },
                {
                    q: "Are the tags waterproof?",
                    a: "Yes, our premium industrial tags are weather-resistant and designed for both indoor and outdoor use. They can withstand spills, cleaning, and light rain."
                }
            ]
        },
        {
            id: 'platform',
            title: 'Software & Data',
            icon: 'dashboard',
            questions: [
                {
                    q: "Does it integrate with my existing CRM?",
                    a: "Yes. VemTap integrates seamlessly with HubSpot, Salesforce, Mailchimp, and thousands of other apps via Zapier or our direct API. Your leads are synced the moment they tap."
                },
                {
                    q: "How secure is the visitor data?",
                    a: "We take privacy seriously. All data is encrypted using AES-256 at rest and TLS 1.3 in transit. We are fully GDPR and CCPA compliant."
                },
                {
                    q: "Can I manage multiple locations?",
                    a: "Absolutely. Our Business and Enterprise plans allow you to manage multiple tags or physical locations from a single centralized dashboard with comparative analytics."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-40 pb-32">
                <section className="px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <span className="text-primary font-bold tracking-wider text-[10px] uppercase mb-4 block">Help Center</span>
                        <h1 className="text-[30px] sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-main mb-8 leading-[1.15] tracking-tight">
                            Frequently Asked <br />
                            <span className="text-gradient">Questions</span>
                        </h1>
                        <p className="text-lg text-text-secondary font-medium leading-relaxed max-w-2xl mx-auto">
                            Find answers to common questions about VemTap's NFC technology, platform integrations, and data security.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-16">
                            {categories.map((category) => (
                                <div key={category.id} className="space-y-8">
                                    <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                        <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center">
                                            <span className="material-icons-round">{category.icon}</span>
                                        </div>
                                        <h2 className="text-2xl font-display font-bold text-text-main">{category.title}</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {category.questions.map((faq, i) => {
                                            const indexId = `${category.id}-${i}`;
                                            const isOpen = openIndex === indexId;
                                            return (
                                                <div
                                                    key={i}
                                                    className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'border-primary/30 bg-primary/5' : 'border-gray-50 bg-white hover:border-gray-200'}`}
                                                >
                                                    <button
                                                        onClick={() => setOpenIndex(isOpen ? null : indexId)}
                                                        className="w-full text-left p-8 flex justify-between items-center cursor-pointer group"
                                                    >
                                                        <span className={`font-bold text-lg md:text-xl pr-8 ${isOpen ? 'text-primary' : 'text-text-main group-hover:text-primary transition-colors'}`}>
                                                            {faq.q}
                                                        </span>
                                                        <span className={`material-icons-round transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-300'}`}>
                                                            expand_more
                                                        </span>
                                                    </button>
                                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <div className="p-8 pt-0 text-text-secondary font-medium leading-relaxed bg-transparent">
                                                            {faq.a}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Support CTA */}
                        <div className="mt-24 p-12 rounded-2xl bg-text-main text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                                <div className="text-center md:text-left">
                                    <h3 className="text-3xl font-display font-bold mb-4">Still have questions?</h3>
                                    <p className="text-white/60 font-medium max-w-md">
                                        Can't find the answer you're looking for? Our support team is available 24/7 to assist you.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button className="bg-primary text-white font-bold px-10 py-5 rounded-full hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 whitespace-nowrap">
                                        Contact Support
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />

            <style jsx>{`
                .text-gradient {
                    background: linear-gradient(to right, #2563eb, #6324eb);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
        </div>
    );
}
