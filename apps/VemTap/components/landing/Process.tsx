'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const steps = [
    {
        step: '1. The Tap',
        heading: 'Tap the card',
        desc: '"It is so fast. It helps us get customer numbers 10x faster than typing it out or using paper."',
        img: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&q=80&w=800',
        color: 'bg-primary'
    },
    {
        step: '2. The Connect',
        heading: 'Capture customer info',
        desc: 'Getting customer details is easy. VemTap captures info in under 2 seconds without them needing to download any app.',
        img: 'https://images.unsplash.com/photo-1556740758-90eb39f3203c?auto=format&fit=crop&q=80&w=800',
        color: 'bg-primary-dark'
    },
    {
        step: '3. The Growth',
        heading: 'Grow your business',
        desc: 'See who visits, reward loyal customers, and improve your marketing with data that is saved automatically.',
        img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
        color: 'bg-[#0a4a3e]'
    }
];

export default function Process() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const nextSlide = () => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % steps.length);
    };

    const prevSlide = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + steps.length) % steps.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95
        })
    };

    return (
        <section id="process" className="py-12 md:py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 px-4">
                    <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Process</span>
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-text-main leading-tight mb-6">
                        Start collecting data in 3 steps
                    </h2>
                </div>

                {/* Desktop View (Grid) */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {steps.map((item, i) => (
                        <Card key={i} item={item} i={i} isMobile={false} />
                    ))}
                </div>

                {/* Mobile View (Carousel) */}
                <div className="md:hidden relative flex flex-col items-center">
                    <div className="relative w-full min-h-[540px] flex items-center justify-center">
                        <AnimatePresence initial={false} custom={direction} mode="wait">
                            <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 400, damping: 40 },
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.2 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.x;
                                    if (swipe < -50) {
                                        nextSlide();
                                    } else if (swipe > 50) {
                                        prevSlide();
                                    }
                                }}
                                className="w-full absolute inset-0"
                            >
                                <Card item={steps[currentIndex]} i={currentIndex} isMobile={true} />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation Controls */}
                    <div className="flex flex-col items-center gap-8 mt-10 w-full px-6">
                        {/* Slide Indicators / Progress */}
                        <div className="flex gap-3">
                            {steps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        setDirection(i > currentIndex ? 1 : -1);
                                        setCurrentIndex(i);
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        currentIndex === i 
                                        ? 'w-10 bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.3)]' 
                                        : 'w-2 bg-gray-200'
                                    }`}
                                    aria-label={`Go to step ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Arrows */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={prevSlide}
                                className="group size-12 rounded-2xl bg-white shadow-soft border border-gray-100 flex items-center justify-center text-text-main hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 cursor-pointer"
                                aria-label="Previous step"
                            >
                                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>

                            <button
                                onClick={nextSlide}
                                className="group size-12 rounded-2xl bg-text-main shadow-lg flex items-center justify-center text-white hover:bg-primary transition-all duration-300 cursor-pointer"
                                aria-label="Next step"
                            >
                                <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Card({ item, i, isMobile }: { item: typeof steps[0], i: number, isMobile: boolean }) {
    return (
        <div className={`group flex flex-col h-full rounded-[2rem] overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 transform ${!isMobile ? 'md:hover:-translate-y-2' : ''}`}>
            <div className="h-64 md:h-72 overflow-hidden relative">
                <img src={item.img} alt={item.step} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute top-6 left-6">
                    <div className="bg-white/95 backdrop-blur-md text-text-main text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg border border-white/20">
                        Step 0{i + 1}
                    </div>
                </div>
            </div>
            <div className={`flex-1 p-8 md:p-12 ${item.color} flex flex-col text-white text-left relative overflow-hidden`}>
                {/* Decorative Background Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-black/5 rounded-full blur-2xl"></div>

                <div className="mb-auto relative z-10">
                    <h3 className="text-3xl md:text-4xl font-bold font-display leading-[1.1] mb-5 tracking-tight">
                        {item.heading}
                    </h3>
                    <p className="text-white/80 font-medium leading-relaxed mb-10 text-sm md:text-base">
                        {item.desc}
                    </p>
                </div>
                <div className="mt-4 relative z-10">
                    <Link href="/how-it-works" className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-text-main transition-all duration-300 cursor-pointer group/btn">
                        Learn More
                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
