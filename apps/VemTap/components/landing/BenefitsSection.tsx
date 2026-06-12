'use client';

import React from 'react';
import { ShieldCheck, Zap, Database, Globe, Smartphone, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const benefits = [
    { title: 'Privacy First', desc: 'Secure data handling that builds customer trust and compliance.', icon: ShieldCheck },
    { title: 'Instant Setup', desc: 'Go live in minutes with our ready-to-use QR and NFC solutions.', icon: Zap },
    { title: 'Scalable Database', desc: 'Manage thousands of customer profiles with ease and precision.', icon: Database },
    { title: 'Global Reach', desc: 'Connect with customers anywhere they are, across any device.', icon: Globe },
    { title: 'Mobile Optimized', desc: 'Experience designed specifically for the mobile-first customer.', icon: Smartphone },
    { title: 'Insightful Analytics', desc: 'Make data-driven decisions with clear, actionable insights.', icon: BarChart3 },
];

export default function BenefitsSection() {
    return (
        <section className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-6">
                        Why Choose Vemtap?
                    </h2>
                    <p className="text-lg text-text-secondary font-medium">
                        Everything you need to transform your business from anonymous transactions to lasting relationships.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-[2rem] bg-white border border-gray-100 flex flex-col items-start text-left group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                        >
                            <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                <benefit.icon size={24} />
                            </div>
                            <h3 className="text-xl font-display font-black text-text-main mb-3">{benefit.title}</h3>
                            <p className="text-sm text-text-secondary font-medium leading-relaxed opacity-70">
                                {benefit.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
