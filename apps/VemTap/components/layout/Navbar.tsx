'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, ChevronRight, Globe, Zap, ShieldCheck, HelpCircle } from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';

const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'How It Works', href: '/how-it-works' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const { data: business } = useMyBusiness(isAuthenticated && user?.role?.toLowerCase() !== 'customer');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const userRole = user?.role?.toLowerCase();
    const dashboardHref = userRole === 'admin' ? '/admin/dashboard' : userRole === 'agent' ? '/agent/dashboard' : '/dashboard';

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-300",
            scrolled ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3" : "bg-transparent py-5"
        )}>
            <nav className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="relative z-10 flex items-center">
                    <Logo className="h-8" />
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
                                    Start Free
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

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 bg-white z-[40] pt-24 px-6 lg:hidden"
                    >
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.label} 
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="text-2xl font-black text-gray-900 flex items-center justify-between group"
                                >
                                    {link.label}
                                    <ChevronRight className="text-gray-200 group-hover:text-[#066CF4] transition-colors" />
                                </Link>
                            ))}
                            
                            <hr className="border-gray-100 my-4" />

                            {isAuthenticated ? (
                                <Link href={dashboardHref} onClick={() => setIsOpen(false)}>
                                    <Button className="w-full h-16 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20">
                                        Go To Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-bold text-gray-500">Login</Link>
                                    <Link href="/get-started" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full h-16 rounded-2xl bg-[#066CF4] text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-blue-500/20">
                                            Start Free
                                        </Button>
                                    </Link>
                                    <Link href="/contact" onClick={() => setIsOpen(false)} className="text-center text-sm font-black uppercase tracking-widest text-gray-400">
                                        Contact Sales
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Footer Info */}
                        <div className="absolute bottom-10 left-6 right-6">
                            <div className="flex items-center gap-6 justify-center">
                                <Link href="/trust" className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                    <ShieldCheck size={12} /> Trust
                                </Link>
                                <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                    <HelpCircle size={12} /> Support
                                </Link>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                                    <Globe size={12} /> Global
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
