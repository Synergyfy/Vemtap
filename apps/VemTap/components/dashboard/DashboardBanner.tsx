'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    className?: string;
}

export default function DashboardBanner({ slides, autoPlayInterval = 5000, className }: DashboardBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const router = useRouter();

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
    const Icon = currentSlide.icon;

    const handleSlideClick = () => {
        if (currentSlide.onAction) {
            currentSlide.onAction();
        } else if (currentSlide.actionUrl) {
            if (currentSlide.actionUrl.startsWith('/')) {
                router.push(currentSlide.actionUrl);
            } else {
                window.location.href = currentSlide.actionUrl;
            }
        }
    };

    return (
        <div 
            className={cn("relative w-full overflow-hidden group select-none", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    onClick={handleSlideClick}
                    className={cn(
                        "rounded-xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer shadow-sm border border-blue-100/80 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-blue-50/80 hover:border-blue-200 flex items-center justify-between gap-2.5 sm:gap-3",
                        currentSlide.color && !currentSlide.color.includes('bg-white') ? currentSlide.color : ""
                    )}
                >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {(Icon || currentSlide.image) && (
                            <div className="size-8 sm:size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                {currentSlide.image ? (
                                    <img src={currentSlide.image} alt={currentSlide.title} className="w-full h-full object-cover" />
                                ) : (
                                    <Icon size={18} className="text-primary" />
                                )}
                            </div>
                        )}
                        <div className="min-w-0 flex-1 leading-tight">
                            <div className="flex items-center gap-1.5 flex-wrap truncate">
                                {currentSlide.tag && (
                                    <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 bg-primary text-white rounded-md uppercase tracking-wider shrink-0">
                                        {currentSlide.tag}
                                    </span>
                                )}
                                <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                                    {currentSlide.title}
                                </span>
                            </div>
                            <p className="text-[10px] sm:text-[11px] font-medium text-gray-600 truncate mt-0.5 flex items-center gap-1">
                                <span className="truncate">{currentSlide.description}</span>
                                {currentSlide.actionLabel && (
                                    <span className="font-bold text-primary underline decoration-primary/40 hover:decoration-primary inline-flex items-center gap-0.5 shrink-0 ml-1">
                                        {currentSlide.actionLabel} &rarr;
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {slides.length > 1 && (
                        <div className="flex gap-1 shrink-0 items-center pl-1" onClick={(e) => e.stopPropagation()}>
                            {slides.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentIndex(i);
                                    }}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-300 cursor-pointer border-none p-0 focus:outline-none",
                                        currentIndex === i 
                                            ? "w-4 bg-primary" 
                                            : "w-1.5 bg-primary/20 hover:bg-primary/40"
                                    )}
                                    aria-label={`Go to slide ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
