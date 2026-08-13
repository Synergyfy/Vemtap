'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { designPresets as presets } from '@/styles/presets';

export default function SupportPage() {
    const supportCategories = [
        {
            title: "Technical Setup",
            icon: "settings_suggest",
            description: "Installing tags, configuring your dashboard, and activating NFC hardware.",
            tags: ["Activation", "Placement", "Hardware"]
        },
        {
            title: "Billing & Plans",
            icon: "account_balance_wallet",
            description: "Manage subscriptions, update payment methods, and download invoices.",
            tags: ["Invoices", "Upgrades", "Methods"]
        },
        {
            title: "Data & Privacy",
            icon: "admin_panel_settings",
            description: "Understanding CRM syncing, data encryption, and GDPR compliance.",
            tags: ["Security", "Integrations", "Leads"]
        },
        {
            title: "Developer API",
            icon: "code",
            description: "Build custom integrations using our robust JSON API and webhooks.",
            tags: ["Webhooks", "Endpoints", "Auth"]
        }
    ];

    const contactMethods = [
        {
            title: "Live Chat",
            status: "Online Now",
            value: "Available 24/7",
            icon: "forum",
            buttonLabel: "Start Chat",
            link: "#"
        },
        {
            title: "Email Support",
            status: "Avg. response: 2h",
            value: "support@vemtap.com",
            icon: "alternate_email",
            buttonLabel: "Send Message",
            link: "mailto:support@vemtap.com"
        },
        {
            title: "Help Center",
            status: "Self Service",
            value: "200+ Articles",
            icon: "auto_stories",
            buttonLabel: "Read Docs",
            link: "/faq"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            <Navbar />

            <main className="pt-48 pb-32">
                {/* Hero */}
                <section className={presets.containerMaxWidth}>
                    <div className="text-center mb-24">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={presets.badge}
                        >
                            Support Center
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={presets.title}
                        >
                            How can we <br />
                            <span className="text-primary">help you?</span>
                        </motion.h1>
                        <h2 className={`${presets.subtitle} mt-2`}>Your satisfaction is our priority</h2>

                        <div className="max-w-xl mx-auto relative mt-12 group">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-focus-within:bg-primary/10 transition-all"></div>
                            <div className="relative bg-white border border-gray-100 p-1.5 rounded-2xl flex items-center shadow-sm">
                                <span className="material-icons-round text-gray-300 ml-4">search</span>
                                <input
                                    type="text"
                                    placeholder="Search help articles..."
                                    className="w-full bg-transparent p-3.5 font-bold text-xs outline-none placeholder:text-gray-300"
                                />
                                <button className="bg-primary text-white font-bold text-[9px] uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-primary-hover transition-all shrink-0">
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Support Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                        {supportCategories.map((cat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className={`${presets.card} p-8 group cursor-pointer`}
                            >
                                <div className="size-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-6 transition-all group-hover:scale-110">
                                    <span className="material-icons-round text-2xl">{cat.icon}</span>
                                </div>
                                <h3 className="text-lg font-display font-bold text-text-main mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
                                <p className="text-xs text-text-secondary font-medium leading-relaxed mb-6">{cat.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {cat.tags.map((tag, j) => (
                                        <span key={j} className="text-[8px] font-bold uppercase tracking-wider bg-gray-50 text-gray-400 px-2 py-1 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact Methods */}
                    <div className="bg-text-main rounded-2xl p-1 flex flex-col lg:flex-row shadow-2xl overflow-hidden">
                        {contactMethods.map((method, i) => (
                            <div
                                key={i}
                                className={`grow p-12 text-center relative group overflow-hidden ${i !== contactMethods.length - 1 ? 'lg:border-r border-white/5' : ''}`}
                            >
                                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="size-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                        <span className="material-icons-round text-2xl">{method.icon}</span>
                                    </div>
                                    <h4 className="text-white font-display font-bold text-lg mb-1">{method.title}</h4>
                                    <p className="text-primary text-[9px] font-bold uppercase tracking-wider mb-4">{method.status}</p>
                                    <p className="text-white/40 font-bold text-sm mb-8">{method.value}</p>

                                    <Link
                                        href={method.link || "#"}
                                        className="w-full py-4 bg-white text-text-main font-bold text-[9px] uppercase tracking-wider rounded-xl hover:bg-primary hover:text-white transition-all shadow-xl"
                                    >
                                        {method.buttonLabel}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
