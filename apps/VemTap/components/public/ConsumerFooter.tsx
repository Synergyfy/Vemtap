'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface FooterSection {
    title: string;
    links: { label: string; href: string }[];
}

const consumerSections: FooterSection[] = [
    {
        title: 'Sell on VemTap',
        links: [
            { label: 'How to Sell', href: '/sell/how-to-sell' },
            { label: 'Business Registration', href: '/sell/register' },
            { label: 'Seller Dashboard', href: '/sell/dashboard' },
            { label: 'Pricing Plans', href: '/sell/pricing' },
            { label: 'Success Stories', href: '/sell/stories' },
        ],
    },
    {
        title: 'Affiliate Program',
        links: [
            { label: 'Join as Affiliate', href: '/affiliate/join' },
            { label: 'How it Works', href: '/affiliate/how-it-works' },
            { label: 'Commission Rates', href: '/affiliate/commissions' },
            { label: 'Affiliate Dashboard', href: '/affiliate/dashboard' },
            { label: 'Affiliate FAQ', href: '/affiliate/faq' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About VemTap', href: '/about' },
            { label: 'Careers', href: '/careers' },
            { label: 'Press & Media', href: '/press' },
            { label: 'Contact Us', href: '/contact' },
            { label: 'Blog', href: '/blog' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '/help' },
            { label: 'How to Buy', href: '/how-to-buy' },
            { label: 'Shipping & Delivery', href: '/shipping' },
            { label: 'Returns & Refunds', href: '/returns' },
            { label: 'Report an Issue', href: '/report' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Cookie Policy', href: '/cookies' },
            { label: 'Intellectual Property', href: '/ip-policy' },
            { label: 'Community Guidelines', href: '/guidelines' },
        ],
    },
];

function CollapsibleSection({ section }: { section: FooterSection }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="sm:hidden border-b border-white/10 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-4 px-1"
            >
                <h4 className="text-[13px] font-semibold text-white">{section.title}</h4>
                {isOpen ? (
                    <ChevronUp size={16} className="text-white/60" />
                ) : (
                    <ChevronDown size={16} className="text-white/60" />
                )}
            </button>
            {isOpen && (
                <ul className="pb-4 space-y-2.5 pl-1">
                    {section.links.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className="text-[12px] text-white/60 hover:text-white transition-colors">
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function ConsumerFooter() {
    const [email, setEmail] = useState('');

    const handleSubscribe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setEmail('');
        }
    };

    return (
        <footer className="bg-[#1a1a2e] text-white">
            {/* Newsletter */}
            <div className="border-b border-white/10">
                <div className="max-w-[1400px] mx-auto px-5 py-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        <div className="flex-1">
                            <h3 className="text-[15px] font-bold mb-1">Subscribe to Our Newsletter</h3>
                            <p className="text-[12px] text-white/60">Get the latest deals, offers, and news delivered to your inbox.</p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="flex-1 sm:w-64 h-10 px-4 bg-white/10 border border-white/20 rounded-lg text-[13px] text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                            />
                            <button
                                type="submit"
                                className="h-10 px-6 bg-[#0055c4] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0055c4]/90 transition-colors active:scale-95"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Links — Desktop: columns, Mobile: collapsible */}
            <div className="max-w-[1400px] mx-auto px-5 py-8">
                {/* Desktop */}
                <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-5 gap-8">
                    {consumerSections.map((section) => (
                        <div key={section.title}>
                            <h4 className="text-[13px] font-semibold text-white mb-4">{section.title}</h4>
                            <ul className="space-y-2.5">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-[12px] text-white/60 hover:text-white transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Mobile */}
                <div className="sm:hidden">
                    {consumerSections.map((section) => (
                        <CollapsibleSection key={section.title} section={section} />
                    ))}
                </div>
            </div>

            {/* App Download & Social */}
            <div className="border-t border-white/10">
                <div className="max-w-[1400px] mx-auto px-5 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        {/* App badges */}
                        <div>
                            <p className="text-[12px] text-white/60 mb-2">Download the VemTap App</p>
                            <div className="flex gap-3">
                                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 rounded-lg">
                                    <span className="text-[18px]">&#128241;</span>
                                    <div className="text-left">
                                        <p className="text-[9px] text-white/60 leading-none">Download on the</p>
                                        <p className="text-[12px] font-semibold leading-tight">App Store</p>
                                    </div>
                                </button>
                                <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-3 py-2 rounded-lg">
                                    <span className="text-[18px]">&#128241;</span>
                                    <div className="text-left">
                                        <p className="text-[9px] text-white/60 leading-none">Get it on</p>
                                        <p className="text-[12px] font-semibold leading-tight">Google Play</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Social */}
                        <div>
                            <p className="text-[12px] text-white/60 mb-2">Follow Us</p>
                            <div className="flex gap-2">
                                {['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube'].map((platform) => (
                                    <button
                                        key={platform}
                                        className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                                        aria-label={platform}
                                    >
                                        <span className="text-[11px] font-bold text-white/70">{platform.charAt(0)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-[1400px] mx-auto px-5 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#0055c4] rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-[10px]">V</span>
                            </div>
                            <p className="text-[11px] text-white/50">
                                &copy; {new Date().getFullYear()} VemTap. All rights reserved.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-white/50">
                            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
