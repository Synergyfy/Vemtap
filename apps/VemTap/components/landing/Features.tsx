'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Link2, 
    Smartphone, 
    Sparkles,
    BarChart3, 
    ShieldCheck, 
    Share2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const features = [
    { 
        icon: <Link2 size={24} />, 
        title: 'Update Links Anytime', 
        desc: 'Change where your card links to anytime without buying a new one. Update offers instantly.', 
        color: 'blue' 
    },
    { 
        icon: <Smartphone size={24} />, 
        title: 'Works Fast on All Phones', 
        desc: 'Loads quickly even on slow mobile networks. Ensure your customers connect without waiting.', 
        color: 'indigo', 
        highlight: true 
    },
    { 
        icon: <Sparkles size={24} />, 
        title: 'Automatic Follow-ups', 
        desc: 'Capture customer interest and send them email or SMS messages immediately.', 
        color: 'purple' 
    },
    { 
        icon: <BarChart3 size={24} />, 
        title: 'Track Usage', 
        desc: 'See how many people scan your card, which phones they use, and when they scan.', 
        color: 'orange' 
    },
    { 
        icon: <ShieldCheck size={24} />, 
        title: 'Secure Data', 
        desc: 'Your data is safe and encrypted. We protect your customer information.', 
        color: 'teal' 
    },
    { 
        icon: <Share2 size={24} />, 
        title: 'Connect Other Apps', 
        desc: 'Send your customer data to other tools you use automatically.', 
        color: 'pink' 
    }
];

const FeatureCard = ({ f, className = "" }: { f: typeof features[0], className?: string }) => (
    <div 
        className={`
            group p-8 md:p-10 rounded-[2rem] transition-all duration-500 border relative overflow-hidden h-full
            ${f.highlight 
                ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/20 md:-translate-y-2' 
                : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-xl hover:border-transparent hover:-translate-y-1 text-text-main'
            }
            ${className}
        `}
    >
        {/* Decorative Background for highlight card */}
        {f.highlight && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
        )}

        <div className={`
            w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500
            ${f.highlight ? 'bg-white/20 backdrop-blur-md text-white' : 'bg-white shadow-lg shadow-gray-200/50 text-primary'}
        `}>
            {f.icon}
        </div>
        <h3 className={`text-xl md:text-2xl font-bold mb-4 font-display tracking-tight ${f.highlight ? 'text-white' : 'text-text-main'}`}>
            {f.title}
        </h3>
        <p className={`leading-relaxed text-sm md:text-base ${f.highlight ? 'text-white/90' : 'text-text-secondary font-medium'}`}>
            {f.desc}
        </p>
    </div>
);

export default function Features() {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % features.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
    };

    return (
        <section id="features" className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
                    <span className="text-primary font-black tracking-[0.3em] text-[10px] uppercase mb-4 block">Power Solutions</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight mb-4">
                        Connect with your customers <br className="hidden sm:block" /> digitally
                    </h2>
                </div>

                {/* Desktop Grid (Hidden on small screens) */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((f, i) => (
                        <FeatureCard key={i} f={f} />
                    ))}
                </div>

                {/* Mobile Carousel (Visible on small screens) */}
                <div className="md:hidden relative px-4">
                    <div className="overflow-hidden py-4 -my-4">
                        <motion.div 
                            className="flex"
                            animate={{ x: `-${activeIndex * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {features.map((f, i) => (
                                <div key={i} className="w-full flex-shrink-0 px-2">
                                    <FeatureCard f={f} />
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Carousel Navigation */}
                    <div className="flex flex-col items-center mt-10 space-y-6">
                        <div className="flex items-center space-x-8">
                            <button 
                                onClick={handlePrev}
                                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-text-main bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                aria-label="Previous feature"
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <div className="flex space-x-2">
                                {features.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                            activeIndex === i ? 'w-8 bg-primary' : 'bg-gray-200'
                                        }`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <button 
                                onClick={handleNext}
                                className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-text-main bg-white hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                                aria-label="Next feature"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

