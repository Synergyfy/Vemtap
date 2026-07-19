'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
    HelpCircle, X, ChevronLeft, ChevronRight, LayoutDashboard,
    Zap, Activity, ClipboardCheck, ShoppingBag, CreditCard, Users,
    Search, UserPlus, MoreHorizontal, Receipt, Landmark, User,
    Footprints, RefreshCw, Upload, Clock, BarChart3, TrendingUp, MapPin,
    Download, Gift, Star, Check, Settings, Layout, FileText, Share2,
    Palette, Eye, Send, MessageSquare, Folder, Plus, Tag, BookOpen,
    ShoppingCart, Package, Edit, AlertTriangle, Truck, Link, DollarSign,
    Trophy, Wallet, Shield, Building, HelpCircle as HelpIcon, MessageCircle,
    Smartphone, QrCode, Reply, Store, Key, Bell, Filter, Grid, Lightbulb,
    CheckSquare, Edit as Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getGuideForPath, type SectionGuide, type TourStep } from '@/constants/pageGuides';

const STORAGE_KEY = 'vt-guides-completed';

function getCompletedGuides(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function markGuideCompleted(id: string) {
    const completed = getCompletedGuides();
    if (!completed.includes(id)) {
        completed.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    }
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
    LayoutDashboard, Zap, Activity, ClipboardCheck, ShoppingBag, CreditCard,
    Users, Search, UserPlus, MoreHorizontal, Receipt, Landmark, User,
    Footprints, RefreshCw, Upload, Clock, BarChart3, TrendingUp, MapPin,
    Download, Gift, Star, Check, Settings, Layout, FileText, Share2,
    Palette, Eye, Send, MessageSquare, Folder, Plus, Tag, BookOpen,
    ShoppingCart, Package, Edit, AlertTriangle, Truck, Link, DollarSign,
    Trophy, Wallet, Shield, Building, HelpCircle, MessageCircle, Smartphone,
    QrCode, Reply, Store, Key, Bell, Filter, Grid, Lightbulb, CheckSquare,
    Pencil,
};

function StepIcon({ name, className }: { name: string; className?: string }) {
    const Icon = ICON_MAP[name] || HelpCircle;
    return <Icon size={20} className={className} />;
}

export default function PageGuide() {
    const pathname = usePathname();
    const guide = getGuideForPath(pathname);
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedGuides, setCompletedGuides] = useState<string[]>([]);

    useEffect(() => {
        setCompletedGuides(getCompletedGuides());
    }, []);

    useEffect(() => {
        setIsActive(false);
        setCurrentStep(0);
    }, [pathname]);

    useEffect(() => {
        if (!isActive) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleSkip();
            if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive, currentStep, guide]);

    const handleStart = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    useEffect(() => {
        window.addEventListener('start-page-guide', handleStart);
        return () => window.removeEventListener('start-page-guide', handleStart);
    }, [handleStart]);

    const handleNext = useCallback(() => {
        if (!guide) return;
        if (currentStep < guide.steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            handleComplete();
        }
    }, [currentStep, guide]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) setCurrentStep(s => s - 1);
    }, [currentStep]);

    const handleComplete = useCallback(() => {
        if (guide) {
            markGuideCompleted(guide.id);
            setCompletedGuides(getCompletedGuides());
        }
        setIsActive(false);
        setCurrentStep(0);
    }, [guide]);

    const handleSkip = useCallback(() => {
        if (guide) {
            markGuideCompleted(guide.id);
            setCompletedGuides(getCompletedGuides());
        }
        setIsActive(false);
        setCurrentStep(0);
    }, [guide]);

    if (!guide) return null;

    const isCompleted = completedGuides.includes(guide.id);
    const step = guide.steps[currentStep];
    const isLastStep = currentStep === guide.steps.length - 1;

    return (
        <>
            {/* Backdrop */}
            {isActive && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[60] transition-opacity"
                    onClick={handleSkip}
                />
            )}

            {/* Tour Tooltip */}
            {isActive && (
                <div className="fixed bottom-24 right-6 sm:right-8 z-[70] w-[360px] max-w-[calc(100vw-3rem)] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-5 pt-5 pb-4">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Step {currentStep + 1} of {guide.steps.length}
                                    </span>
                                </div>
                                <button
                                    onClick={handleSkip}
                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 mb-1">{guide.title}</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">{guide.description}</p>
                        </div>

                        {/* Step Content */}
                        <div className="px-5 pb-4">
                            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <StepIcon name={step.icon} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h4>
                                    <p className="text-[13px] text-gray-600 leading-relaxed">{step.content}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Dots */}
                        <div className="px-5 pb-4">
                            <div className="flex items-center justify-center gap-1.5">
                                {guide.steps.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentStep(i)}
                                        className={cn(
                                            "rounded-full transition-all duration-200",
                                            i === currentStep
                                                ? "w-6 h-2 bg-primary"
                                                : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-5 pb-5 flex items-center justify-between">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all",
                                    currentStep === 0
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-600 hover:bg-gray-100"
                                )}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSkip}
                                    className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={isLastStep ? handleComplete : handleNext}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    {isLastStep ? 'Done' : 'Next'}
                                    {!isLastStep && <ChevronRight size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


        </>
    );
}
