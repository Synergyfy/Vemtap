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

export default function DashboardBanner({ slides, autoPlayInterval = 4000 }: DashboardBannerProps) {
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
            className="relative w-full h-[180px] md:h-[220px] rounded-3xl overflow-hidden group shadow-xl shadow-gray-200/50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={slides[currentIndex].id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                        "absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-10",
                        slides[currentIndex].color || "bg-gradient-to-r from-emerald-600 to-teal-500"
                    )}
                >
                    {/* Content */}
                    <div className="flex-1 text-white z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                {slides[currentIndex].icon ? <slides[currentIndex].icon size={20} className="text-white" /> : <Sparkles size={20} />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Announcements</span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-display font-bold mb-2 md:mb-3 leading-tight">
                            {slides[currentIndex].title}
                        </h2>
                        <p className="text-xs md:text-sm font-medium opacity-90 max-w-xl leading-relaxed mb-4 md:mb-6">
                            {slides[currentIndex].description}
                        </p>
                        
                        {slides[currentIndex].actionLabel && (
                            <button 
                                onClick={() => slides[currentIndex].actionUrl && (window.location.href = slides[currentIndex].actionUrl)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-black/10"
                            >
                                {slides[currentIndex].actionLabel}
                                <ArrowRight size={14} />
                            </button>
                        )}
                    </div>

                    {/* Decorative Image/Shape */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 overflow-hidden pointer-events-none hidden md:block">
                        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-black/5 rounded-full blur-2xl" />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                currentIndex === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                        <ChevronRight size={20} />
                    </button>
                </>
            )}
        </div>
    );
}
