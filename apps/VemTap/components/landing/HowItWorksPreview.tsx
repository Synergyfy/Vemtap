'use client';

import React from 'react';
import { ArrowRight, QrCode, MapPin, Smartphone, UserCheck, Database, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
    { title: 'Generate QR', desc: 'Create custom QR codes or NFC plates in your dashboard.', icon: QrCode },
    { title: 'Place QR', desc: 'Display them at your checkout, tables, or entry points.', icon: MapPin },
    { title: 'Customer Scans', desc: 'Visitor taps or scans using their smartphone.', icon: Smartphone },
    { title: 'Customer Registers', desc: 'They provide their details in a simple 2-second form.', icon: UserCheck },
    { title: 'Data Captured', desc: 'Information is instantly stored in your secure database.', icon: Database },
    { title: 'Follow Up & Grow', desc: 'Reach out with smart messages and bring them back.', icon: MessageSquare },
];

export default function HowItWorksPreview() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-6">
                        How It Works
                    </h2>
                    <p className="text-lg text-text-secondary font-medium">
                        A seamless 6-step process to bridge the gap between your physical space and digital growth.
                    </p>
                </div>

                <div className="relative">
                    {/* Desktop Connector Line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="size-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 relative">
                                    <step.icon size={24} />
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 text-gray-200 group-hover:text-primary transition-colors">
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-sm font-black text-text-main mb-2 uppercase tracking-widest">{step.title}</h3>
                                <p className="text-[10px] text-text-secondary font-bold leading-relaxed opacity-60 px-4">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
