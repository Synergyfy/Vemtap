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

    useEffect(() => {
        if (isHovered || slides.length <= 1) return;
        const timer = setInterval(nextSlide, autoPlayInterval);
        return () => clearInterval(timer);
    }, [isHovered, slides.length, nextSlide, autoPlayInterval]);

    if (!slides.length) return null;

    return (
        <div 
            className="relative w-full overflow-hidden group mb-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={slides[currentIndex].id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                        "rounded-[1.5rem] p-4 md:p-5 border-none shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all duration-500",
                        slides[currentIndex].color || "bg-gradient-to-r from-[#066CF4] to-[#4293FF]"
                    )}
                >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="min-w-0">
                            <h2 className="text-sm font-black text-white leading-tight flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#066CF4] bg-white px-1.5 py-0.5 rounded-md shrink-0 shadow-sm">NEWS</span>
                                <span className="truncate">{slides[currentIndex].title}</span>
                            </h2>
                            <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider leading-snug">
                                {slides[currentIndex].description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                        {slides.length > 1 && (
                            <div className="flex gap-1">
                                {slides.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            currentIndex === i ? "w-4 bg-white" : "w-1 bg-white/30"
                                        )} 
                                    />
                                ))}
                            </div>
                        )}
                        
                        {slides[currentIndex].actionLabel && (
                            <button 
                                onClick={() => slides[currentIndex].actionUrl && (window.location.href = slides[currentIndex].actionUrl)}
                                className="text-[9px] font-black uppercase tracking-[0.15em] text-white hover:text-white/80 transition-all active:scale-95 flex items-center gap-1.5 underline underline-offset-4 decoration-1"
                            >
                                {slides[currentIndex].actionLabel}
                                <ArrowRight size={12} className="no-underline" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
