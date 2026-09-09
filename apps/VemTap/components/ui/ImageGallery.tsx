'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageGalleryProps {
    images: string[];
    alt: string;
    className?: string;
    showDots?: boolean;
    showArrows?: boolean;
    aspectClass?: string;
    layout?: 'carousel' | 'product';
}

export default function ImageGallery({
    images,
    alt,
    className = '',
    showDots = true,
    showArrows = true,
    aspectClass = 'aspect-[3/2]',
    layout = 'carousel',
}: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchDeltaX = useRef(0);

    const safeImages = images?.length > 0 ? images : [];
    const hasMultiple = safeImages.length > 1;
    const portalRoot = typeof document !== 'undefined' ? document.body : null;

    const goPrev = useCallback(() => {
        setCurrentIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
    }, [safeImages.length]);

    const goNext = useCallback(() => {
        setCurrentIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
    }, [safeImages.length]);

    const lightboxPrev = useCallback(() => {
        setLightboxIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
    }, [safeImages.length]);

    const lightboxNext = useCallback(() => {
        setLightboxIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));
    }, [safeImages.length]);

    const openLightbox = (idx: number) => {
        setLightboxIndex(idx);
        setLightboxOpen(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchDeltaX.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    };

    const handleTouchEnd = () => {
        if (Math.abs(touchDeltaX.current) > 50) {
            if (touchDeltaX.current > 0) goPrev();
            else goNext();
        }
        touchDeltaX.current = 0;
    };

    const lightboxTouchStart = useRef(0);
    const lightboxTouchDelta = useRef(0);

    const handleLightboxTouchStart = (e: React.TouchEvent) => {
        lightboxTouchStart.current = e.touches[0].clientX;
        lightboxTouchDelta.current = 0;
    };

    const handleLightboxTouchMove = (e: React.TouchEvent) => {
        lightboxTouchDelta.current = e.touches[0].clientX - lightboxTouchStart.current;
    };

    const handleLightboxTouchEnd = () => {
        if (Math.abs(lightboxTouchDelta.current) > 50) {
            if (lightboxTouchDelta.current > 0) lightboxPrev();
            else lightboxNext();
        }
        lightboxTouchDelta.current = 0;
    };

    if (safeImages.length === 0) return null;

    /* ─── Lightbox ─── */
    const lightbox = lightboxOpen && portalRoot ? createPortal(
        <div
            className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
            onClick={() => setLightboxOpen(false)}
        >
            {/* Close button */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0">
                <span className="text-white/70 text-[13px] font-medium">
                    {lightboxIndex + 1} / {safeImages.length}
                </span>
                <button
                    onClick={() => setLightboxOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <X size={22} className="text-white" />
                </button>
            </div>

            {/* Image area */}
            <div
                className="flex-1 flex items-center justify-center px-4 pb-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleLightboxTouchStart}
                onTouchMove={handleLightboxTouchMove}
                onTouchEnd={handleLightboxTouchEnd}
            >
                <div className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center">
                    <img
                        src={safeImages[lightboxIndex]}
                        alt={`${alt} ${lightboxIndex + 1}`}
                        className="max-w-full max-h-full object-contain select-none"
                    />
                    {/* Arrows */}
                    {hasMultiple && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Thumbnail strip */}
            {hasMultiple && (
                <div className="flex justify-center gap-2 px-4 pb-4 shrink-0 overflow-x-auto">
                    {safeImages.map((src, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                            className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === lightboxIndex
                                    ? 'border-white shadow-lg scale-105'
                                    : 'border-white/20 opacity-50 hover:opacity-80'
                            }`}
                        >
                            <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>,
        portalRoot
    ) : null;

    /* ─── Product Layout ─── */
    if (layout === 'product') {
        return (
            <>
                <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
                    {/* Main Image — clickable */}
                    <div
                        ref={containerRef}
                        className="relative overflow-hidden group rounded-xl sm:flex-1 sm:max-w-[calc(100%-90px)] cursor-zoom-in"
                        onClick={() => openLightbox(currentIndex)}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="relative aspect-[16/10] w-full bg-gray-100">
                            <img
                                src={safeImages[currentIndex]}
                                alt={`${alt} ${currentIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {hasMultiple && showArrows && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            )}
                            {hasMultiple && (
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                                    {currentIndex + 1}/{safeImages.length}
                                </div>
                            )}
                        </div>
                        {hasMultiple && showDots && (
                            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 sm:hidden">
                                {safeImages.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            idx === currentIndex ? 'bg-white w-5' : 'bg-white/50'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {hasMultiple && (
                        <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:max-h-[280px] shrink-0 sm:w-[68px] pb-1 sm:pb-0">
                            {safeImages.map((src, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`relative shrink-0 w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === currentIndex
                                            ? 'border-[#0055c4] shadow-md'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img
                                        src={src}
                                        alt={`${alt} thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {lightbox}
            </>
        );
    }

    /* ─── Carousel Layout ─── */
    return (
        <>
            <div
                ref={containerRef}
                className={`relative overflow-hidden group ${className}`}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
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
                {hasMultiple && (
                    <div className="absolute top-1.5 right-1.5 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full hidden sm:block">
                        {currentIndex + 1}/{safeImages.length}
                    </div>
                )}
            </div>
            {lightbox}
        </>
    );
}
