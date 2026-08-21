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
    onAction?: () => void;
    color?: string;
    tag?: string;
    isLight?: boolean;
    children?: React.ReactNode;
    targetType?: 'custom' | 'deals-page' | 'deal';
    targetId?: string;
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
    const hasCustomContent = !!currentSlide.children;

    return (
        <div 
            className="relative w-full overflow-hidden group"
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
                        "rounded-2xl border-none shadow-sm transition-all duration-500 overflow-hidden",
                        hasCustomContent
                            ? "p-0"
                            : "px-4 md:px-6 py-4 md:py-5 h-[160px] md:h-[180px] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-5",
                        currentSlide.color || "bg-gradient-to-r from-[#066CF4] to-[#4293FF]"
                    )}
                >
                    {hasCustomContent ? (
                        <>
                            <div className="relative w-full">
                                {currentSlide.children}
                            </div>
                            {slides.length > 1 && (
                                <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
                                    {slides.map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={cn(
                                                "h-1 rounded-full transition-all duration-300",
                                                currentIndex === i 
                                                    ? "w-6 bg-white" 
                                                    : "w-1.5 bg-white/40"
                                            )} 
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                    <>
                    <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                        {(currentSlide.icon || currentSlide.image) && (
                            <div className={cn(
                                "size-9 md:size-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden",
                                isLight ? "bg-[#066CF4]/5 text-[#066CF4]" : "bg-white/20 text-white"
                            )}>
                                {currentSlide.image ? (
                                    <img src={currentSlide.image} alt={currentSlide.title} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <currentSlide.icon size={18} className="md:hidden" />
                                        <currentSlide.icon size={22} className="hidden md:block" />
                                    </>
                                )}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h2 className={cn(
                                "text-[15px] md:text-lg font-bold leading-tight flex items-center gap-2 mb-1",
                                isLight ? "text-gray-900" : "text-white"
                            )}>
                                {currentSlide.tag && (
                                    <span className={cn(
                                        "text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm",
                                        currentSlide.tag === 'SETUP' ? "text-emerald-600 bg-emerald-50" : "text-[#066CF4] bg-white"
                                    )}>
                                        {currentSlide.tag}
                                    </span>
                                )}
                                <span className="truncate min-w-0">{currentSlide.title}</span>
                            </h2>
                            <p className={cn(
                                "text-xs md:text-sm font-normal leading-snug md:leading-relaxed max-w-[460px] line-clamp-2 opacity-90",
                                isLight ? "text-gray-400" : "text-white/80"
                            )}>
                                {currentSlide.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center shrink-0">
                        {currentSlide.actionLabel && (
                            <button 
                                onClick={() => {
                                    if (currentSlide.onAction) {
                                        currentSlide.onAction();
                                    } else if (currentSlide.actionUrl) {
                                        window.location.href = currentSlide.actionUrl;
                                    }
                                }}
                                className={cn(
                                    "h-9 md:h-10 px-4 md:px-5 rounded-lg font-bold text-[10px] md:text-[11px] shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap",
                                    isLight ? "bg-[#066CF4] text-white shadow-blue-500/20" : "bg-white text-[#066CF4]"
                                )}
                            >
                                {currentSlide.actionLabel}
                                <ArrowRight size={14} className="md:hidden" />
                                <ArrowRight size={15} className="hidden md:block" />
                            </button>
                        )}

                        {slides.length > 1 && (
                            <div className="flex gap-1.5 ml-2 md:ml-3 items-center">
                                {slides.map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "h-1 rounded-full transition-all duration-300",
                                            currentIndex === i 
                                                ? (isLight ? "w-5 bg-[#066CF4]" : "w-5 bg-white") 
                                                : (isLight ? "w-1.5 bg-gray-300" : "w-1.5 bg-white/40")
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
                    </>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
