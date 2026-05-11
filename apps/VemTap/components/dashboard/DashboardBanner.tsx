'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Megaphone, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BannerSlide {
    id: string;
    title: string;
    description: string;
    icon?: any;
    image?: string;
    actionLabel?: string;
    actionUrl?: string;
    color?: string;
}

interface DashboardBannerProps {
    slides: BannerSlide[];
    autoPlayInterval?: number;
}

export default function DashboardBanner({ slides, autoPlayInterval = 5000 }: DashboardBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    useEffect(() => {
        if (isHovered || slides.length <= 1) return;
        const timer = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(timer);
    }, [isHovered, slides.length, nextSlide, autoPlayInterval]);

    if (!slides.length) return null;

    return (
        <div 
            className="relative w-full min-h-[220px] md:h-[260px] rounded-[32px] overflow-hidden group shadow-2xl shadow-black/5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={slides[currentIndex].id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                        "absolute inset-0 flex flex-col justify-center p-8 md:p-12",
                        slides[currentIndex].color || "bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500"
                    )}
                >
                    {/* Abstract Background Decoration */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white rounded-full blur-[100px] -mr-40 -mt-40" />
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black rounded-full blur-[80px] -ml-20 -mb-20" />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 max-w-3xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 mb-4 md:mb-6"
                        >
                            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xl border border-white/20 shadow-lg">
                                {(() => {
                                    const Icon = slides[currentIndex].icon;
                                    return Icon ? <Icon size={18} className="text-white" /> : <Sparkles size={18} />;
                                })()}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Announcements</span>
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl md:text-5xl font-display font-bold text-white mb-3 md:mb-4 leading-[1.1] tracking-tight"
                        >
                            {slides[currentIndex].title}
                        </motion.h2>

                        <motion.p 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-sm md:text-lg font-medium text-white/80 max-w-2xl leading-relaxed mb-4 md:mb-6"
                        >
                            {slides[currentIndex].description}
                        </motion.p>
                        
                        {slides[currentIndex].actionLabel && (
                            <motion.button 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={() => slides[currentIndex].actionUrl && (window.location.href = slides[currentIndex].actionUrl)}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0 active:scale-95"
                            >
                                {slides[currentIndex].actionLabel}
                                <ArrowRight size={16} className="text-primary" />
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Pagination Controls */}
            <div className="absolute bottom-8 right-8 flex items-center gap-6 z-20">
                <div className="flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                "h-1 rounded-full transition-all duration-500",
                                currentIndex === i ? "w-10 bg-white" : "w-2 bg-white/30 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
                
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={prevSlide}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xl text-white border border-white/10 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-xl text-white border border-white/10 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
