'use client';

import React from 'react';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const problems = [
    { title: 'Customers Visit Once', desc: 'No way to bring them back after they walk out the door.' },
    { title: 'No Customer Database', desc: 'Losing valuable data about who your real customers are.' },
    { title: 'No Follow Up System', desc: 'Missing opportunities to engage and nurture relationships.' },
    { title: 'Expensive Advertising', desc: 'Paying high costs to reach new people while ignoring old ones.' },
    { title: 'Lost Sales Opportunities', desc: 'Unknown visitor needs lead to unfulfilled potential revenue.' },
];

export default function ProblemSection() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-text-main tracking-tight mb-6">
                        Most Businesses Lose Customers Every Day
                    </h2>
                    <p className="text-lg text-text-secondary font-medium">
                        Running a physical business shouldn't mean flying blind. Here's why traditional methods are failing you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100 flex flex-col items-start text-left group hover:bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                        >
                            <div className="size-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <XCircle size={24} />
                            </div>
                            <h3 className="text-xl font-display font-black text-text-main mb-3">{problem.title}</h3>
                            <p className="text-sm text-text-secondary font-medium leading-relaxed opacity-70">
                                {problem.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
