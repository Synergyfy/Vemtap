'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import Logo from '@/components/brand/Logo';

interface FooterLink {
    label: string;
    href: string;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const footerSections: FooterSection[] = [
    {
        title: 'Discover',
        links: [
            { label: 'Deals', href: '/deals' },
            { label: 'Businesses', href: '/deals' },
            { label: 'Categories', href: '/deals' },
            { label: 'Search', href: '/deals' },
            { label: 'Locations', href: '/deals' },
        ],
    },
    {
        title: 'For Businesses',
        links: [
            { label: 'Why VEMTAP', href: '/business' },
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Business Login', href: '/login' },
            { label: 'Get Started', href: '/get-started' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', href: '/business' },
            { label: 'Contact', href: '/contact' },
            { label: 'Help', href: '/support' },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
        ],
    },
];

function CollapsibleFooterSection({ section }: { section: FooterSection }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100">
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="w-full flex items-center justify-between py-4 text-left group"
            >
                <h4 className="font-bold text-sm font-display uppercase tracking-wider text-gray-900 group-hover:text-primary transition-colors">
                    {section.title}
                </h4>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <ul className="pb-4 space-y-3 text-text-secondary font-bold text-sm">
                    {section.links.map((link) => (
                        <li key={link.label}>
                            <Link href={link.href} className="hover:text-primary transition-colors">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function StaticFooterSection({ section }: { section: FooterSection }) {
    return (
        <div>
            <h4 className="font-bold text-sm mb-6 font-display uppercase tracking-wider text-gray-900">{section.title}</h4>
            <ul className="space-y-3 text-text-secondary font-bold text-sm">
                {section.links.map((link) => (
                    <li key={link.label}>
                        <Link href={link.href} className="hover:text-primary transition-colors">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="bg-white text-text-main py-16 md:py-20 border-t border-gray-100">
            <div className="vemtap-container">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-x-8 gap-y-10 mb-16">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="mb-6 block w-fit">
                            <Logo className="flex items-center h-14" iconSize={72} />
                        </Link>
                        <p className="text-text-secondary max-w-xs mb-8 font-bold leading-relaxed text-sm">
                            Discover deals, businesses, products and services around you.
                        </p>
                        <div className="flex gap-3">
                            <Link href="https://facebook.com/vemtap" className="size-9 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round text-lg">facebook</span>
                            </Link>
                            <Link href="https://instagram.com/vemtapng" className="size-9 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round text-lg">camera_alt</span>
                            </Link>
                            <Link href="https://linkedin.com/company/vemtap" className="size-9 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round text-lg">business</span>
                            </Link>
                            <Link href="https://x.com/vemtap" className="size-9 rounded-full bg-gray-50 flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white transition-all">
                                <span className="material-icons-round text-lg">X</span>
                            </Link>
                        </div>
                    </div>
                    {/* Link sections — expanded columns on desktop, collapsible accordion on mobile */}
                    {footerSections.map((section) => (
                        <div key={section.title}>
                            <div className="hidden md:block">
                                <StaticFooterSection section={section} />
                            </div>
                            <div className="md:hidden">
                                <CollapsibleFooterSection section={section} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <p>© {new Date().getFullYear()} VemTap Inc. All rights reserved.</p>
                    <div className="flex gap-8 mt-6 md:mt-0 flex-wrap justify-center">
                        <Link href="/privacy" className="hover:text-text-main transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-text-main transition-colors">Terms of Service</Link>
                        <Link href="/cookie-policy" className="hover:text-text-main transition-colors">Cookie Policy</Link>
                        <Link href="/dpa" className="hover:text-text-main transition-colors">DPA</Link>
                        <Link href="/trust" className="hover:text-text-main transition-colors">Trust & Security</Link>
                        <Link href="/status" className="hover:text-text-main transition-colors">Status</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
