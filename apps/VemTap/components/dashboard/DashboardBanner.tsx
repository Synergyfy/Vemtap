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
    tag?: string;
    isLight?: boolean;
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

    const currentSlide = slides[currentIndex];
    const isLight = currentSlide.isLight;

    return (
        <div 
            className="relative w-full overflow-hidden group mb-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                        "rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-10 border-none shadow-lg shadow-blue-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 transition-all duration-500 min-h-[140px] md:min-h-[220px]",
                        currentSlide.color || "bg-gradient-to-r from-[#066CF4] to-[#4293FF]"
                    )}
                >
                    <div className="flex items-start gap-3 md:gap-6 flex-1 min-w-0">
                        {currentSlide.icon && (
                            <div className={cn(
                                "size-10 md:size-16 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                isLight ? "bg-[#066CF4]/5 text-[#066CF4]" : "bg-white/20 text-white"
                            )}>
                                <currentSlide.icon size={isLight ? 24 : 20} className="md:hidden" />
                                <currentSlide.icon size={isLight ? 32 : 28} className="hidden md:block" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className={cn(
                                "text-base md:text-2xl font-black leading-tight flex flex-wrap items-center gap-2 mb-1 md:mb-2",
                                isLight ? "text-gray-900" : "text-white"
                            )}>
                                {currentSlide.tag && (
                                    <span className={cn(
                                        "text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 shadow-sm",
                                        currentSlide.tag === 'SETUP' ? "text-emerald-600 bg-emerald-50" : "text-[#066CF4] bg-white"
                                    )}>
                                        {currentSlide.tag}
                                    </span>
                                )}
                                <span className="truncate">{currentSlide.title}</span>
                            </h2>
                            <p className={cn(
                                "text-[10px] md:text-sm font-medium leading-snug md:leading-relaxed max-w-[450px] opacity-90",
                                isLight ? "text-gray-400" : "text-white/80"
                            )}>
                                {currentSlide.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-4 md:gap-6 shrink-0">
                        {currentSlide.actionLabel && (
                            <button 
                                onClick={() => currentSlide.actionUrl && (window.location.href = currentSlide.actionUrl)}
                                className={cn(
                                    "h-10 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs shadow-xl active:scale-95 transition-all flex items-center gap-2",
                                    isLight ? "bg-[#066CF4] text-white shadow-blue-500/20" : "bg-white text-[#066CF4] shadow-black/10"
                                )}
                            >
                                {currentSlide.actionLabel}
                                <ArrowRight size={14} className="md:hidden" />
                                <ArrowRight size={16} className="hidden md:block" />
                            </button>
                        )}

                        {slides.length > 1 && (
                            <div className="flex gap-1.5 md:mt-2">
                                {slides.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            currentIndex === i 
                                                ? (isLight ? "w-6 bg-[#066CF4]" : "w-6 bg-white") 
                                                : (isLight ? "w-1.5 bg-gray-200" : "w-1.5 bg-white/30")
                                        )} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Decorative background element for Light mode */}
                    {isLight && (
                        <div className="absolute -right-12 -top-12 size-48 bg-[#066CF4]/5 rounded-full blur-3xl pointer-events-none" />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
