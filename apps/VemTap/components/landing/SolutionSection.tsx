'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const solutions = [
    { title: 'Collect Data Fast', desc: 'Scan or Tap to capture details in under 2 seconds.' },
    { title: 'Reach Customers Directly', desc: 'Send SMS, Email or WhatsApp messages in 1-click.' },
    { title: 'Targeted Offers', desc: 'Engage customers based on their specific behavior.' },
    { title: 'Live Dashboard', desc: 'See your customer growth in real-time, anytime.' },
    { title: 'Automated Feedback', desc: 'Collect reviews and address concerns instantly.' },
    { title: 'Powerful Integrations', desc: 'Connect with tools you already use for seamless growth.' },
];

export default function SolutionSection() {
    return (
        <section className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-6">
                        Vemtap Solves This
                    </h2>
                    <p className="text-lg text-text-secondary font-medium">
                        We provide the tools to capture, engage, and retain every person that interacts with your business.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {solutions.map((solution, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-[2rem] bg-white border border-gray-100 flex flex-col items-start text-left group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                        >
                            <div className="size-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="text-xl font-display font-black text-text-main mb-3">{solution.title}</h3>
                            <p className="text-sm text-text-secondary font-medium leading-relaxed opacity-70">
                                {solution.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
