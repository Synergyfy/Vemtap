import React from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';

export default function Footer() {
    return (
        <footer className="bg-white text-gray-900 py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-14">
                    <div className="col-span-1 sm:col-span-2 md:col-span-1">
                        <Link href="/" className="mb-6 block w-fit">
                            <Logo className="flex items-center h-12" iconSize={56} />
                        </Link>
                        <p className="text-gray-500 max-w-xs text-sm font-medium leading-relaxed">
                            Discover deals, businesses, products and services around you.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-5">Discover</h4>
                        <ul className="space-y-3 text-gray-500 font-medium text-sm">
                            <li><Link href="/deals" className="hover:text-[#066CF4] transition-colors">Nearby Deals</Link></li>
                            <li><Link href="/marketplace" className="hover:text-[#066CF4] transition-colors">Businesses</Link></li>
                            <li><Link href="/deals" className="hover:text-[#066CF4] transition-colors">Search</Link></li>
                            <li><Link href="/deals" className="hover:text-[#066CF4] transition-colors">Categories</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-5">For Businesses</h4>
                        <ul className="space-y-3 text-gray-500 font-medium text-sm">
                            <li><Link href="/for-businesses" className="hover:text-[#066CF4] transition-colors">For Businesses</Link></li>
                            <li><Link href="/pricing" className="hover:text-[#066CF4] transition-colors">Pricing</Link></li>
                            <li><Link href="/login" className="hover:text-[#066CF4] transition-colors">Business Login</Link></li>
                            <li><Link href="/get-started" className="hover:text-[#066CF4] transition-colors">Get Started</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 mb-5">Company</h4>
                        <ul className="space-y-3 text-gray-500 font-medium text-sm">
                            <li><Link href="/how-it-works" className="hover:text-[#066CF4] transition-colors">About</Link></li>
                            <li><Link href="/contact" className="hover:text-[#066CF4] transition-colors">Contact</Link></li>
                            <li><Link href="/support" className="hover:text-[#066CF4] transition-colors">Help</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#066CF4] transition-colors">Privacy</Link></li>
                            <li><Link href="/terms" className="hover:text-[#066CF4] transition-colors">Terms</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <p>© {new Date().getFullYear()} VemTap Inc. All rights reserved.</p>
                    <div className="flex gap-6 flex-wrap justify-center">
                        <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
                        <Link href="/cookie-policy" className="hover:text-gray-900 transition-colors">Cookies</Link>
                        <Link href="/trust" className="hover:text-gray-900 transition-colors">Trust</Link>
                        <Link href="/status" className="hover:text-gray-900 transition-colors">Status</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
