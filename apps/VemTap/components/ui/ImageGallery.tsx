'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
    alt: string;
    className?: string;
    /** Show dot indicators */
    showDots?: boolean;
    /** Show arrow navigation on hover (desktop) */
    showArrows?: boolean;
    /** Aspect ratio class */
    aspectClass?: string;
}

export default function ImageGallery({
    images,
    alt,
    className = '',
    showDots = true,
    showArrows = true,
    aspectClass = 'aspect-[3/2]',
}: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);

    const safeImages = images?.length > 0 ? images : [];
    const hasMultiple = safeImages.length > 1;

    const goPrev = useCallback(() => {
        setCurrentIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
    }, [safeImages.length]);

    const goNext = useCallback(() => {
        setCurrentIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
    }, [safeImages.length]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };

    const handleTouchEnd = () => {
        if (Math.abs(touchDeltaX.current) > 50) {
            if (touchDeltaX.current > 0) {
                goPrev();
            } else {
                goNext();
            }
        }
        touchDeltaX.current = 0;
    };

    if (safeImages.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden group ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Image Strip */}
            <div
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {safeImages.map((src, idx) => (
                    <div key={idx} className={`min-w-full h-full ${aspectClass}`}>
                        <img
                            src={src}
                            alt={`${alt} ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading={idx === 0 ? 'eager' : 'lazy'}
                        />
                    </div>
                ))}
            </div>

            {/* Arrow Navigation — desktop only */}
            {hasMultiple && showArrows && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                    >
                        <ChevronRight size={16} />
                    </button>
                </>
            )}

            {/* Dot Indicators — mobile */}
            {hasMultiple && showDots && (
                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 sm:hidden">
                    {safeImages.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                idx === currentIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Image Count Badge — desktop */}
            {hasMultiple && (
                <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full hidden sm:block">
                    {currentIndex + 1}/{safeImages.length}
                </div>
            )}
        </div>
    );
}
