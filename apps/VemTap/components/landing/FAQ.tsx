'use client';
import React, { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle } from 'lucide-react';

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: "Do customers need an app?",
            a: "No. Customers just tap their phone on the card, and your page opens instantly. It works with almost all smartphones."
        },
        {
            q: "How do I set up the card?",
            a: "It takes less than 2 minutes. When you get your card, enter the number in your dashboard, choose your message, and stick the card anywhere people can see it."
        },
        {
            q: "Can I use it for multiple shops?",
            a: "Yes. Our Business plans allow you to manage multiple cards or shops from one dashboard. You can see how all your shops are doing in one place."
        },
        {
            q: "What if a customer's phone doesn't work?",
            a: "Every VemTap card has a QR code printed on it. If a phone is old, they can scan the QR code to do the same thing."
        },
        {
            q: "Is the data safe?",
            a: "Yes, we take privacy seriously. All data is safe and we never sell your customer data to anyone."
        },
        {
            q: "Does it connect with other tools?",
            a: "Yes. VemTap connects with many other apps you might use. Your customer data is sent there automatically."
        }
    ];

    return (
        <section id="faq" className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 sm:px-10">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
                        <HelpCircle size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            Common Questions
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight tracking-tight">
                        Everything you need <br className="hidden sm:block" /> to know
                    </h2>
                </div>

                <div className="space-y-4 md:space-y-6">
                    {faqs.map((faq, i) => (
                        <div
                            key={i}
                            className={`group rounded-3xl border transition-all duration-500 overflow-hidden ${openIndex === i ? 'border-primary/20 bg-primary/[0.02] shadow-xl shadow-primary/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                className="w-full text-left p-6 md:p-10 flex justify-between items-center cursor-pointer appearance-none outline-hidden"
                            >
                                <span className={`font-bold text-lg md:text-xl pr-8 tracking-tight transition-colors duration-300 ${openIndex === i ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                                    {faq.q}
                                </span>
                                <div className={`shrink-0 size-8 md:size-10 rounded-full flex items-center justify-center transition-all duration-500 ${openIndex === i ? 'bg-primary text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </button>
                            <div className={`transition-all duration-500 ease-in-out ${openIndex === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="px-6 md:px-10 pb-8 md:pb-12 text-text-secondary font-medium leading-relaxed md:text-lg">
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Support CTA */}
                <div className="mt-20 p-8 md:p-12 rounded-[3rem] bg-gray-900 border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/20 transition-colors" />
                    
                    <div className="text-center md:text-left relative z-10">
                        <h4 className="font-display font-bold text-2xl md:text-3xl text-white mb-3 tracking-tight">Still have questions?</h4>
                        <p className="text-white/60 font-medium">Our support team is available 24/7 to help you get started.</p>
                    </div>
                    
                    <button className="bg-primary text-white font-black text-xs uppercase tracking-widest px-10 py-5 rounded-2xl hover:bg-primary-hover transition-all shadow-2xl shadow-primary/30 whitespace-nowrap cursor-pointer flex items-center gap-3 relative z-10 active:scale-95">
                        <MessageCircle size={18} className="fill-current" />
                        Chat with Support
                    </button>
                </div>
            </div>
        </section>
    );
}
