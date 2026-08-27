'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight, ShieldCheck, HelpCircle } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Nearby Deals', href: '/deals' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    useMyBusiness(isAuthenticated && user?.role?.toLowerCase() !== 'customer');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const userRole = user?.role?.toLowerCase();
    const dashboardHref = userRole === 'admin' ? '/admin/dashboard' : userRole === 'agent' ? '/agent/dashboard' : '/dashboard';

    return (
        <>
        <header className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
            scrolled || isOpen ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3" : "bg-transparent py-5"
        )}>
            <nav className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="relative z-10 lg:z-auto flex items-center">
                    <Logo className="flex items-center h-12 lg:h-16" />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.label} 
                            href={link.href}
                            className="text-sm font-bold text-gray-600 hover:text-[#066CF4] transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Desktop CTAs */}
                <div className="hidden lg:flex items-center gap-4">
                    <Link
                        href="/for-businesses"
                        className="text-sm font-bold text-gray-600 hover:text-[#066CF4] transition-colors"
                    >
                        For Businesses
                    </Link>
                    {isAuthenticated ? (
                        <Link href={dashboardHref}>
                            <Button className="h-12 px-8 rounded-xl bg-[#066CF4] text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                My Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-sm font-black uppercase tracking-widest text-gray-600 hover:text-[#066CF4]">
                                    Login
                                </Button>
                            </Link>
                            <Link href="/get-started">
                                <Button className="h-12 px-8 rounded-xl bg-[#066CF4] text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                    Get Started
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden relative z-50 p-2 text-gray-900"
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </nav>
        </header>

        {/* Mobile Navigation Overlay — outside header so z-index escapes its stacking context */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[200] lg:hidden flex flex-col bg-white"
                >
                    <div className="flex items-center justify-between px-6 pt-6 pb-5">
                        <Logo className="flex items-center h-9 lg:h-11" />
                        <button
                            onClick={() => setIsOpen(false)}
                            className="size-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-900 hover:text-[#066CF4] hover:border-primary/30 transition-all"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden px-6 pb-10">
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 group hover:border-primary/25 hover:bg-primary/[0.02] active:scale-[0.99] transition-all"
                                >
                                    <span className="text-[15px] font-bold text-text-main group-hover:text-[#066CF4] transition-colors">
                                        {link.label}
                                    </span>
                                    <span className="flex items-center justify-center size-8 rounded-full bg-gray-50 group-hover:bg-primary/10 group-hover:text-[#066CF4] transition-colors">
                                        <ChevronRight size={16} className="text-gray-400 group-hover:text-[#066CF4]" />
                                    </span>
                                </Link>
                            ))}
                        </nav>

                        <hr className="border-gray-100 my-7" />

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/for-businesses"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 group hover:border-primary/25 hover:bg-primary/[0.02] active:scale-[0.99] transition-all"
                            >
                                <span className="text-[15px] font-bold text-text-main group-hover:text-[#066CF4] transition-colors">
                                    For Businesses
                                </span>
                                <span className="flex items-center justify-center size-8 rounded-full bg-gray-50 group-hover:bg-primary/10 group-hover:text-[#066CF4] transition-colors">
                                    <ChevronRight size={16} className="text-gray-400 group-hover:text-[#066CF4]" />
                                </span>
                            </Link>
                            {isAuthenticated ? (
                                <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-14 rounded-xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.99] transition-all">
                                        Go To Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/get-started" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-14 rounded-xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-[0.99] transition-all">
                                            Get Started
                                        </Button>
                                    </Link>
                                    <Link href="/login" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-14 rounded-xl border border-gray-200 bg-white text-[15px] font-bold text-text-main hover:border-[#066CF4]/40 hover:text-[#066CF4] active:scale-[0.99] transition-all">
                                            Login
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-2.5">
                            <Link
                                href="/trust"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary hover:text-[#066CF4] hover:border-primary/25 transition-all"
                            >
                                <ShieldCheck size={14} /> Trust
                            </Link>
                            <Link
                                href="/support"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.14em] text-text-secondary hover:text-[#066CF4] hover:border-primary/25 transition-all"
                            >
                                <HelpCircle size={14} /> Support
                            </Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
