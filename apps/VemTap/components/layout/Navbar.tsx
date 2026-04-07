'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyBusiness } from '@/services/businesses/hooks';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const { data: business } = useMyBusiness(isAuthenticated && user?.role?.toLowerCase() !== 'customer');
    const solutionsRef = useRef<HTMLDivElement>(null);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Close the Solutions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (solutionsRef.current && !solutionsRef.current.contains(e.target as Node)) {
                setIsSolutionsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const userRole = user?.role?.toLowerCase();
    const dashboardHref = userRole === 'admin' ? '/admin/dashboard' : userRole === 'agent' ? '/agent/dashboard' : '/dashboard';

    return (
        <>
            <div className="fixed left-0 right-0 z-50 flex justify-center px-4" style={{ top: 'calc(1.5rem + var(--pwa-banner-offset, 0px))' }}>
                <nav className={`bg-white/80 text-text-main rounded-full py-0 px-6 flex items-center shadow-xl shadow-gray-200/20 border border-gray-200/50 max-w-5xl w-full justify-between backdrop-blur-xl transition-all duration-300`}>
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center -my-2">
                            <Logo className="flex items-center" />
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-secondary">
                        {/* Solutions Dropdown - Click/tap controlled */}
                        <div className="relative" ref={solutionsRef}>
                            <button
                                onClick={() => setIsSolutionsOpen(prev => !prev)}
                                className="flex items-center gap-1 hover:text-primary transition-colors py-2"
                            >
                                Solutions
                                <span
                                    className={`material-icons-round text-lg transition-transform duration-200 ${isSolutionsOpen ? 'rotate-180' : ''}`}
                                >
                                    expand_more
                                </span>
                            </button>
                            {isSolutionsOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Link
                                        href="/solutions/hardware"
                                        onClick={() => setIsSolutionsOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="size-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <span className="material-icons-round">nfc</span>
                                        </div>
                                        <div>
                                            <p className="text-text-main text-xs font-black uppercase tracking-wider">Hardware</p>
                                            <p className="text-[10px] text-text-secondary font-medium">NFC Plates & Cards</p>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/solutions/software"
                                        onClick={() => setIsSolutionsOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="size-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                            <span className="material-icons-round">terminal</span>
                                        </div>
                                        <div>
                                            <p className="text-text-main text-xs font-black uppercase tracking-wider">Software</p>
                                            <p className="text-[10px] text-text-secondary font-medium">Management Dashboard</p>
                                        </div>
                                    </Link>
                                    <Link
                                        href="/pricing"
                                        onClick={() => setIsSolutionsOpen(false)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="size-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                                            <span className="material-icons-round">workspace_premium</span>
                                        </div>
                                        <div>
                                            <p className="text-text-main text-xs font-black uppercase tracking-wider">White Label</p>
                                            <p className="text-[10px] text-text-secondary font-medium">Reseller Infrastructure</p>
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>
                        <Link className="hover:text-primary transition-colors" href="/marketplace">Marketplace</Link>
                        <Link className="hover:text-primary transition-colors" href="/features">Features</Link>
                        <Link className="hover:text-primary transition-colors" href="/pricing">Pricing</Link>
                        <Link className="hover:text-primary transition-colors" href="/support">Support</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated && (business || userRole === 'admin' || userRole === 'agent') ? (
                            <div className="relative group">
                                <Link href={dashboardHref} className="flex items-center gap-2 pl-2 pr-4 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold ring-2 ring-white overflow-hidden">
                                        {business?.logoUrl ? (
                                            <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                                        ) : (
                                            getInitials(business?.name || user?.firstName || 'User')
                                        )}
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold text-text-main leading-tight group-hover:text-primary transition-colors">
                                            {business?.name || 'My Dashboard'}
                                        </span>
                                        <span className="text-[10px] text-text-secondary font-medium leading-tight">
                                            {userRole === 'admin' ? 'Control Tower' : userRole === 'agent' ? 'Agent Desk' : 'Dashboard'}
                                        </span>
                                    </div>
                                </Link>

                                {/* Dropdown */}
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                    <Link href={dashboardHref} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-text-secondary hover:text-text-main hover:bg-gray-50 rounded-lg transition-colors">
                                        <span className="material-icons-round text-lg">dashboard</span>
                                        Go to Dashboard
                                    </Link>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button
                                        onClick={() => {
                                            const { logout } = useAuthStore.getState();
                                            logout();
                                            window.location.href = '/login';
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
                                    >
                                        <span className="material-icons-round text-lg">logout</span>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="text-text-main font-bold text-sm px-5 py-2 hover:text-primary transition-colors cursor-pointer text-center">
                                    Login
                                </Link>
                                <Link href="/get-started" className="bg-primary text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 cursor-pointer">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="md:hidden flex items-center justify-center size-10 rounded-full bg-gray-50 text-text-main hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <span className="material-icons-round">menu</span>
                    </button>
                </nav >
            </div >

            <div className={`fixed inset-0 z-100 transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                <div className={`absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-500 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} p-8 flex flex-col`}>
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex items-center gap-2">
                            <Logo />
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="size-10 rounded-full bg-gray-50 text-text-main flex items-center justify-center cursor-pointer">
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>

                    <div className="flex flex-col gap-8 text-xl font-bold text-text-secondary">
                        <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors" href="/">Home</Link>
                        <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors" href="/marketplace">Marketplace</Link>
                        <div className="flex flex-col gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Solutions</span>
                            <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors pl-4 border-l-2 border-gray-100" href="/solutions/hardware">Hardware</Link>
                            <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors pl-4 border-l-2 border-gray-100" href="/solutions/software">Software</Link>
                            <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors pl-4 border-l-2 border-gray-100" href="/pricing">White Label</Link>
                        </div>
                        <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors" href="/features">Features</Link>
                        <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors" href="/pricing">Pricing</Link>
                        <Link onClick={() => setIsMenuOpen(false)} className="hover:text-primary transition-colors" href="/support">Support</Link>
                    </div>

                    <div className="mt-auto flex flex-col gap-4">
                        <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 rounded-2xl bg-gray-50 text-text-main font-bold border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer text-center">
                            Login
                        </Link>
                        <Link href="/get-started" onClick={() => setIsMenuOpen(false)} className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary-hover transition-colors text-center">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
